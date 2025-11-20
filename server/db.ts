import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, farms, boundaries, yields, costs, InsertFarm, InsertBoundary, InsertYield, InsertCost, batchOrders, batchOrderItems, InsertBatchOrder, InsertBatchOrderItem } from "../drizzle/schema";
import { ENV } from './_core/env';
import { and, or, like, gte, lte, eq, desc } from "drizzle-orm";

const logBatchOrderDbEvent = (event: string, payload: Record<string, unknown>) => {
  try {
    console.info(
      JSON.stringify({
        source: "batchOrder.db",
        event,
        ...payload,
      })
    );
  } catch {
    // ignore logging failures
  }
};

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
    let query = db.select().from(farms);
    
    // Apply filters if provided
    // NOTE: userId filter removed for demo purposes to show all 238 farms
    const conditions: any[] = [];
    
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

// ==================== Chat Messages ====================

export async function createChatMessage(data: {
  userId: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  category?: string;
}) {
  const db = await getDb();
  const { chatMessages } = await import("../drizzle/schema");
  
  const result = await db.insert(chatMessages).values({
    userId: data.userId,
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    category: data.category,
  });
  
  return Number(result[0].insertId);
}

export async function getChatMessagesByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  const { chatMessages } = await import("../drizzle/schema");
  const { desc, eq } = await import("drizzle-orm");
  
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  
  return messages.reverse(); // Return in chronological order (oldest first)
}

export async function getChatMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  const { chatMessages } = await import("../drizzle/schema");
  const { asc, eq } = await import("drizzle-orm");
  
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt));
  
  return messages;
}

export async function deleteChatMessagesByUserId(userId: number) {
  const db = await getDb();
  const { chatMessages } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}

// ==================== Conversations ====================

export async function createConversation(data: {
  userId: number;
  title: string;
}) {
  const db = await getDb();
  const { conversations } = await import("../drizzle/schema");
  
  const result = await db.insert(conversations).values({
    userId: data.userId,
    title: data.title,
  });
  
  return Number(result[0].insertId);
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  const { conversations } = await import("../drizzle/schema");
  const { desc, eq } = await import("drizzle-orm");
  
  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
  
  return convos;
}

export async function updateConversationTitle(id: number, title: string) {
  const db = await getDb();
  const { conversations } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  const { conversations, chatMessages } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  // Delete all messages in the conversation first
  await db.delete(chatMessages).where(eq(chatMessages.conversationId, id));
  
  // Then delete the conversation
  await db.delete(conversations).where(eq(conversations.id, id));
}

export async function touchConversation(id: number) {
  const db = await getDb();
  const { conversations } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function searchConversations(userId: number, query: string) {
  const db = await getDb();
  const { conversations, chatMessages } = await import("../drizzle/schema");
  const { desc, eq, like, or, sql } = await import("drizzle-orm");
  
  if (!query || query.trim() === "") {
    // Return all conversations if no query
    return await getConversationsByUserId(userId);
  }
  
  const searchTerm = `%${query}%`;
  
  // Search in conversation titles
  const matchingConversations = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        like(conversations.title, searchTerm)
      )
    )
    .orderBy(desc(conversations.updatedAt));
  
  // Search in message content
  const matchingMessages = await db
    .select({
      conversationId: chatMessages.conversationId,
      messageCount: sql<number>`COUNT(DISTINCT ${chatMessages.id})`.as('messageCount'),
    })
    .from(chatMessages)
    .innerJoin(conversations, eq(chatMessages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        like(chatMessages.content, searchTerm)
      )
    )
    .groupBy(chatMessages.conversationId);
  
  // Get conversation IDs that match messages
  const messageConversationIds = new Set(matchingMessages.map(m => m.conversationId));
  
  // Fetch full conversation details for message matches
  const messageConversations = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        sql`${conversations.id} IN (${messageConversationIds.size > 0 ? Array.from(messageConversationIds).join(',') : 'NULL'})`
      )
    )
    .orderBy(desc(conversations.updatedAt));
  
  // Combine results and remove duplicates
  const allResults = [...matchingConversations, ...messageConversations];
  const uniqueResults = Array.from(
    new Map(allResults.map(c => [c.id, c])).values()
  );
  
  // Sort by updatedAt (newest first)
  uniqueResults.sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  });
  
  return uniqueResults;
}

export async function addChatMessage(data: {
  conversationId: number;
  role: "user" | "assistant";
  content: string;
}) {
  const db = await getDb();
  const { chatMessages } = await import("../drizzle/schema");
  
  const result = await db.insert(chatMessages).values({
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
  });
  
  // Update conversation's updatedAt timestamp
  await touchConversation(data.conversationId);
  
  return Number(result[0].insertId);
}

// ==================== Analytics Functions ====================

/**
 * Get harvest trends by region (municipality) over time
 */
export async function getHarvestTrendsByRegion(input?: {
  startDate?: string;
  endDate?: string;
  region?: "all" | "bacolod" | "laguna";
}) {
  const db = await getDb();
  if (!db) return [];

  const { yields, farms } = await import("../drizzle/schema");
  const { sql, eq, and, gte, lte } = await import("drizzle-orm");

  // Build where conditions
  const conditions = [];
  
  if (input?.region && input.region !== "all") {
    if (input.region === "bacolod") {
      conditions.push(like(farms.municipality, "%Bacolod%"));
    } else if (input.region === "laguna") {
      conditions.push(like(farms.municipality, "%Laguna%"));
    }
  }
  
  if (input?.startDate) {
    conditions.push(gte(yields.harvestDate, input.startDate));
  }
  
  if (input?.endDate) {
    conditions.push(lte(yields.harvestDate, input.endDate));
  }

  // Query with grouping by municipality and month
  const results = await db
    .select({
      municipality: farms.municipality,
      month: sql<string>`DATE_FORMAT(${yields.harvestDate}, '%Y-%m')`.as('month'),
      totalQuantity: sql<number>`SUM(${yields.quantity})`.as('totalQuantity'),
      avgYield: sql<number>`AVG(CAST(${yields.quantity} AS DECIMAL(10,2)))`.as('avgYield'),
      harvestCount: sql<number>`COUNT(${yields.id})`.as('harvestCount'),
    })
    .from(yields)
    .innerJoin(farms, eq(yields.farmId, farms.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(farms.municipality, sql`DATE_FORMAT(${yields.harvestDate}, '%Y-%m')`)
    .orderBy(sql`month ASC`);

  return results;
}

/**
 * Get crop performance comparison (yield, harvest, revenue)
 */
export async function getCropPerformance(input?: {
  startDate?: string;
  endDate?: string;
  region?: "all" | "bacolod" | "laguna";
}) {
  const db = await getDb();
  if (!db) return [];

  const { yields, farms } = await import("../drizzle/schema");
  const { sql, eq, and, gte, lte } = await import("drizzle-orm");

  // Build where conditions
  const conditions = [];
  
  if (input?.region && input.region !== "all") {
    if (input.region === "bacolod") {
      conditions.push(like(farms.municipality, "%Bacolod%"));
    } else if (input.region === "laguna") {
      conditions.push(like(farms.municipality, "%Laguna%"));
    }
  }
  
  if (input?.startDate) {
    conditions.push(gte(yields.harvestDate, input.startDate));
  }
  
  if (input?.endDate) {
    conditions.push(lte(yields.harvestDate, input.endDate));
  }

  // Query with grouping by crop type
  const results = await db
    .select({
      crop: yields.cropType,
      totalQuantity: sql<number>`SUM(CAST(${yields.quantity} AS DECIMAL(10,2)))`.as('totalQuantity'),
      avgYield: sql<number>`AVG(CAST(${yields.quantity} AS DECIMAL(10,2)))`.as('avgYield'),
      totalRevenue: sql<number>`SUM(CAST(${yields.quantity} AS DECIMAL(10,2)) * 50)`.as('totalRevenue'), // Assuming avg price of 50 per unit
      harvestCount: sql<number>`COUNT(${yields.id})`.as('harvestCount'),
      farmCount: sql<number>`COUNT(DISTINCT ${yields.farmId})`.as('farmCount'),
    })
    .from(yields)
    .innerJoin(farms, eq(yields.farmId, farms.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(yields.cropType)
    .orderBy(sql`totalRevenue DESC`);

  return results;
}

/**
 * Get cost analysis by category and ROI by crop
 */
export async function getCostAnalysis(input?: {
  startDate?: string;
  endDate?: string;
  region?: "all" | "bacolod" | "laguna";
}) {
  const db = await getDb();
  if (!db) return { costsByCategory: [], roiByCrop: [] };

  const { costs, yields, farms } = await import("../drizzle/schema");
  const { sql, eq, and, gte, lte } = await import("drizzle-orm");

  // Build where conditions for costs
  const costConditions = [];
  
  if (input?.region && input.region !== "all") {
    if (input.region === "bacolod") {
      costConditions.push(like(farms.municipality, "%Bacolod%"));
    } else if (input.region === "laguna") {
      costConditions.push(like(farms.municipality, "%Laguna%"));
    }
  }
  
  if (input?.startDate) {
    costConditions.push(gte(costs.date, input.startDate));
  }
  
  if (input?.endDate) {
    costConditions.push(lte(costs.date, input.endDate));
  }

  // Get costs by category
  const costsByCategory = await db
    .select({
      category: costs.category,
      totalAmount: sql<number>`SUM(${costs.amount})`.as('totalAmount'),
      transactionCount: sql<number>`COUNT(${costs.id})`.as('transactionCount'),
    })
    .from(costs)
    .innerJoin(farms, eq(costs.farmId, farms.id))
    .where(costConditions.length > 0 ? and(...costConditions) : undefined)
    .groupBy(costs.category)
    .orderBy(sql`totalAmount DESC`);

  // Calculate ROI by crop (Revenue - Costs) / Costs
  // First get total costs per farm
  const farmCosts = await db
    .select({
      farmId: costs.farmId,
      totalCost: sql<number>`SUM(${costs.amount})`.as('totalCost'),
    })
    .from(costs)
    .innerJoin(farms, eq(costs.farmId, farms.id))
    .where(costConditions.length > 0 ? and(...costConditions) : undefined)
    .groupBy(costs.farmId);

  // Build where conditions for yields
  const yieldConditions = [];
  
  if (input?.region && input.region !== "all") {
    if (input.region === "bacolod") {
      yieldConditions.push(like(farms.municipality, "%Bacolod%"));
    } else if (input.region === "laguna") {
      yieldConditions.push(like(farms.municipality, "%Laguna%"));
    }
  }
  
  if (input?.startDate) {
    yieldConditions.push(gte(yields.harvestDate, input.startDate));
  }
  
  if (input?.endDate) {
    yieldConditions.push(lte(yields.harvestDate, input.endDate));
  }

  // Get total revenue per crop
  const cropRevenue = await db
    .select({
      crop: yields.cropType,
      farmId: yields.farmId,
      totalRevenue: sql<number>`SUM(CAST(${yields.quantity} AS DECIMAL(10,2)) * 50)`.as('totalRevenue'), // Assuming avg price of 50 per unit
    })
    .from(yields)
    .innerJoin(farms, eq(yields.farmId, farms.id))
    .where(yieldConditions.length > 0 ? and(...yieldConditions) : undefined)
    .groupBy(yields.crop, yields.farmId);

  // Calculate ROI by crop
  const costMap = new Map(farmCosts.map(fc => [fc.farmId, fc.totalCost]));
  const roiByFarmCrop = cropRevenue.map(cr => {
    const cost = costMap.get(cr.farmId) || 0;
    const revenue = cr.totalRevenue || 0;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    return {
      crop: cr.crop,
      farmId: cr.farmId,
      revenue,
      cost,
      roi,
    };
  });

  // Aggregate ROI by crop
  const cropRoiMap = new Map<string, { totalRevenue: number; totalCost: number; count: number }>();
  roiByFarmCrop.forEach(item => {
    const existing = cropRoiMap.get(item.crop) || { totalRevenue: 0, totalCost: 0, count: 0 };
    cropRoiMap.set(item.crop, {
      totalRevenue: existing.totalRevenue + item.revenue,
      totalCost: existing.totalCost + item.cost,
      count: existing.count + 1,
    });
  });

  const roiByCrop = Array.from(cropRoiMap.entries()).map(([crop, data]) => ({
    crop,
    totalRevenue: data.totalRevenue,
    totalCost: data.totalCost,
    roi: data.totalCost > 0 ? ((data.totalRevenue - data.totalCost) / data.totalCost) * 100 : 0,
    farmCount: data.count,
  })).sort((a, b) => b.roi - a.roi);

  return { costsByCategory, roiByCrop };
}

/**
 * Get regional comparison (Bacolod vs Laguna)
 */
export async function getRegionalComparison(input?: {
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { yields, costs, farms } = await import("../drizzle/schema");
  const { sql, eq, and, gte, lte } = await import("drizzle-orm");

  // Build where conditions
  const conditions = [];
  
  if (input?.startDate) {
    conditions.push(gte(yields.harvestDate, input.startDate));
  }
  
  if (input?.endDate) {
    conditions.push(lte(yields.harvestDate, input.endDate));
  }

  // Get metrics by region
  const results = await db
    .select({
      region: sql<string>`CASE 
        WHEN ${farms.municipality} LIKE '%Bacolod%' THEN 'Bacolod'
        WHEN ${farms.municipality} LIKE '%Laguna%' THEN 'Laguna'
        ELSE 'Other'
      END`.as('region'),
      totalHarvest: sql<number>`SUM(${yields.quantity})`.as('totalHarvest'),
      avgYield: sql<number>`AVG(CAST(${yields.quantity} AS DECIMAL(10,2)))`.as('avgYield'),
      totalRevenue: sql<number>`SUM(CAST(${yields.quantity} AS DECIMAL(10,2)) * 50)`.as('totalRevenue'), // Assuming avg price of 50 per unit
      farmCount: sql<number>`COUNT(DISTINCT ${farms.id})`.as('farmCount'),
      harvestCount: sql<number>`COUNT(${yields.id})`.as('harvestCount'),
    })
    .from(yields)
    .innerJoin(farms, eq(yields.farmId, farms.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`region`)
    .orderBy(sql`region ASC`);

  // Get cost data by region
  const costConditions = [];
  
  if (input?.startDate) {
    costConditions.push(gte(costs.date, input.startDate));
  }
  
  if (input?.endDate) {
    costConditions.push(lte(costs.date, input.endDate));
  }

  const costResults = await db
    .select({
      region: sql<string>`CASE 
        WHEN ${farms.municipality} LIKE '%Bacolod%' THEN 'Bacolod'
        WHEN ${farms.municipality} LIKE '%Laguna%' THEN 'Laguna'
        ELSE 'Other'
      END`.as('region'),
      totalCost: sql<number>`SUM(${costs.amount})`.as('totalCost'),
    })
    .from(costs)
    .innerJoin(farms, eq(costs.farmId, farms.id))
    .where(costConditions.length > 0 ? and(...costConditions) : undefined)
    .groupBy(sql`region`);

  // Merge results
  const costMap = new Map(costResults.map(cr => [cr.region, cr.totalCost]));
  const finalResults = results.map(r => ({
    ...r,
    totalCost: costMap.get(r.region) || 0,
    roi: (costMap.get(r.region) || 0) > 0 
      ? (((r.totalRevenue || 0) - (costMap.get(r.region) || 0)) / (costMap.get(r.region) || 0)) * 100 
      : 0,
  }));

  return finalResults;
}

// Batch Orders management

export async function createBatchOrder(
  order: InsertBatchOrder,
  items: InsertBatchOrderItem[]
) {
  return withRetry(async (db) => {
    await db.transaction(async (tx) => {
      await tx.insert(batchOrders).values(order);

      if (items.length > 0) {
        await tx.insert(batchOrderItems).values(items);
      }
    });

    logBatchOrderDbEvent("create", {
      batchOrderId: order.id,
      referenceCode: order.referenceCode,
      status: order.status,
      itemCount: items.length,
      createdByUserId: order.createdByUserId,
    });

    return order.id;
  }, "createBatchOrder");
}

export async function updateBatchOrder(
  orderId: string,
  orderData: Partial<InsertBatchOrder>,
  items: InsertBatchOrderItem[]
) {
  return withRetry(async (db) => {
    await db.transaction(async (tx) => {
      await tx.update(batchOrders)
        .set(orderData)
        .where(eq(batchOrders.id, orderId));

      await tx.delete(batchOrderItems)
        .where(eq(batchOrderItems.batchOrderId, orderId));

      if (items.length > 0) {
        await tx.insert(batchOrderItems).values(items);
      }
    });

    logBatchOrderDbEvent("update", {
      batchOrderId: orderId,
      status: orderData.status,
      itemCount: items.length,
    });

    return orderId;
  }, "updateBatchOrder");
}

export async function getBatchOrderById(orderId: string) {
  return withRetry(async (db) => {
    const [order] = await db.select()
      .from(batchOrders)
      .where(eq(batchOrders.id, orderId))
      .limit(1);
    
    if (!order) {
      return null;
    }
    
    const items = await db.select()
      .from(batchOrderItems)
      .where(eq(batchOrderItems.batchOrderId, orderId));
    
    return {
      ...order,
      items,
    };
  }, "getBatchOrderById");
}

export async function listBatchOrders(filters?: {
  status?: Array<"draft" | "pending_approval" | "approved" | "cancelled" | "completed">;
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}) {
  return withRetry(async (db) => {
    let query = db.select().from(batchOrders);
    
    const conditions: any[] = [];
    
    if (filters?.status && filters.status.length > 0) {
      conditions.push(
        or(...filters.status.map(s => eq(batchOrders.status, s)))
      );
    }
    
    if (filters?.supplierId) {
      conditions.push(eq(batchOrders.supplierId, filters.supplierId));
    }
    
    if (filters?.fromDate) {
      conditions.push(gte(batchOrders.expectedDeliveryDate, filters.fromDate));
    }
    
    if (filters?.toDate) {
      conditions.push(lte(batchOrders.expectedDeliveryDate, filters.toDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Order by created date descending
    query = query.orderBy(desc(batchOrders.createdAt)) as any;
    
    // Apply limit and offset
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }, "listBatchOrders");
}

export async function deleteBatchOrder(orderId: string) {
  return withRetry(async (db) => {
    // Delete items first (cascade)
    await db.delete(batchOrderItems)
      .where(eq(batchOrderItems.batchOrderId, orderId));
    
    // Delete order
    await db.delete(batchOrders)
      .where(eq(batchOrders.id, orderId));
  }, "deleteBatchOrder");
}

/**
 * Check if a batch order reference code already exists in the database.
 * Used for ensuring uniqueness when generating new reference codes.
 * 
 * @param referenceCode - The reference code to check
 * @returns true if the code is unique (doesn't exist), false if it already exists
 */
export async function isBatchOrderReferenceCodeUnique(referenceCode: string): Promise<boolean> {
  return withRetry(async (db) => {
    const [existing] = await db.select()
      .from(batchOrders)
      .where(eq(batchOrders.referenceCode, referenceCode))
      .limit(1);
    
    return !existing; // Return true if no existing order found (code is unique)
  }, "isBatchOrderReferenceCodeUnique");
}
