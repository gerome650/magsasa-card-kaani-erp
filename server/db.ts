import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, farms, boundaries, yields, costs, InsertFarm, InsertBoundary, InsertYield, InsertCost } from "../drizzle/schema";
import { ENV } from './_core/env';
import { and, or, like, gte, lte } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Connection pool configuration
const POOL_CONFIG = {
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Reconnection settings
  connectTimeout: 10000,
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2, // exponential backoff
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create connection pool with proper error handling
 */
async function createPool(): Promise<mysql.Pool> {
  if (_pool) {
    return _pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("[Database] DATABASE_URL environment variable is not set");
  }

  try {
    _pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ...POOL_CONFIG,
    });

    // Test the connection
    const connection = await _pool.getConnection();
    console.log("[Database] Connection pool created successfully");
    connection.release();

    // Handle pool errors
    _pool.on('error', (err) => {
      console.error("[Database] Pool error:", err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log("[Database] Connection lost, pool will reconnect automatically");
      }
    });

    return _pool;
  } catch (error) {
    console.error("[Database] Failed to create connection pool:", error);
    _pool = null;
    throw error;
  }
}

/**
 * Get database instance with automatic retry logic
 */
export async function getDb() {
  if (_db) {
    return _db;
  }

  if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not set, database operations will be skipped");
    return null;
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const pool = await createPool();
      _db = drizzle(pool);
      console.log(`[Database] Connected successfully (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
      return _db;
    } catch (error) {
      lastError = error as Error;
      console.error(`[Database] Connection attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed:`, error);
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`[Database] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  console.error("[Database] All connection attempts failed:", lastError);
  _db = null;
  return null;
}

/**
 * Execute database operation with retry logic
 */
async function withRetry<T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }
      return await operation(db);
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is connection-related
      const isConnectionError = 
        error instanceof Error && (
          error.message.includes('closed state') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('PROTOCOL_CONNECTION_LOST')
        );

      if (isConnectionError && attempt < RETRY_CONFIG.maxRetries) {
        console.warn(`[Database] ${operationName} failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries}):`, error);
        
        // Reset connection on connection errors
        _db = null;
        _pool = null;
        
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`[Database] Reconnecting in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${RETRY_CONFIG.maxRetries} attempts`);
}

/**
 * Graceful shutdown - close pool connections
 */
export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[Database] Connection pool closed");
  }
}

// User management

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  return withRetry(async (db) => {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  }, "upsertUser");
}

export async function getUserByOpenId(openId: string) {
  return withRetry(async (db) => {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }, "getUserByOpenId");
}

// Farm management queries

// Farms
export async function getFarmsByUserId(
  userId: number,
  filters?: {
    search?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return withRetry(async (db) => {
    let query = db.select().from(farms).where(eq(farms.userId, userId));
    
    // Apply filters if provided
    const conditions = [eq(farms.userId, userId)];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(farms.name, `%${filters.search}%`),
          like(farms.farmerName, `%${filters.search}%`),
          like(farms.barangay, `%${filters.search}%`)
        )!
      );
    }
    
    if (filters?.startDate) {
      conditions.push(gte(farms.createdAt, new Date(filters.startDate)));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(farms.createdAt, new Date(filters.endDate)));
    }
    
    if (conditions.length > 0) {
      query = db.select().from(farms).where(and(...conditions));
    }
    
    return await query;
  }, "getFarmsByUserId");
}

export async function getFarmById(id: number) {
  return withRetry(async (db) => {
    const result = await db.select().from(farms).where(eq(farms.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  }, "getFarmById");
}

export async function createFarm(farm: InsertFarm & { userId: number }) {
  return withRetry(async (db) => {
    const result = await db.insert(farms).values(farm);
    return result[0].insertId;
  }, "createFarm");
}

export async function updateFarm(id: number, data: Partial<InsertFarm>) {
  return withRetry(async (db) => {
    await db.update(farms).set(data).where(eq(farms.id, id));
  }, "updateFarm");
}

export async function deleteFarm(id: number) {
  return withRetry(async (db) => {
    // Delete related data first
    await db.delete(boundaries).where(eq(boundaries.farmId, id));
    await db.delete(yields).where(eq(yields.farmId, id));
    await db.delete(costs).where(eq(costs.farmId, id));
    // Delete farm
    await db.delete(farms).where(eq(farms.id, id));
  }, "deleteFarm");
}

// Boundaries
export async function getBoundariesByFarmId(farmId: number) {
  return withRetry(async (db) => {
    return await db.select().from(boundaries).where(eq(boundaries.farmId, farmId));
  }, "getBoundariesByFarmId");
}

export async function saveBoundaries(farmId: number, boundaryData: InsertBoundary[]) {
  return withRetry(async (db) => {
    // Delete existing boundaries for this farm
    await db.delete(boundaries).where(eq(boundaries.farmId, farmId));
    
    // Insert new boundaries
    if (boundaryData.length > 0) {
      const values = boundaryData.map(b => ({
        farmId,
        parcelIndex: b.parcelIndex,
        geoJson: b.geoJson,
        area: b.area,
      }));
      await db.insert(boundaries).values(values);
    }
  }, "saveBoundaries");
}

// Yields
export async function getYieldsByFarmId(farmId: number) {
  return withRetry(async (db) => {
    return await db.select().from(yields).where(eq(yields.farmId, farmId));
  }, "getYieldsByFarmId");
}

export async function createYield(yieldData: InsertYield) {
  return withRetry(async (db) => {
    const result = await db.insert(yields).values(yieldData);
    return result[0].insertId;
  }, "createYield");
}

export async function deleteYield(id: number) {
  return withRetry(async (db) => {
    await db.delete(yields).where(eq(yields.id, id));
  }, "deleteYield");
}

// Costs
export async function getCostsByFarmId(farmId: number) {
  return withRetry(async (db) => {
    return await db.select().from(costs).where(eq(costs.farmId, farmId));
  }, "getCostsByFarmId");
}

export async function createCost(costData: InsertCost) {
  return withRetry(async (db) => {
    const result = await db.insert(costs).values(costData);
    return result[0].insertId;
  }, "createCost");
}

export async function deleteCost(id: number) {
  return withRetry(async (db) => {
    await db.delete(costs).where(eq(costs.id, id));
  }, "deleteCost");
}
