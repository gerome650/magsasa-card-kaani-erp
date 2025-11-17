import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, farms, boundaries, yields, costs, InsertFarm, InsertBoundary, InsertYield, InsertCost } from "../drizzle/schema";
import { ENV } from './_core/env';
import { and, or, like, gte, lte } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      _db = drizzle(connection);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(farms.userId, userId)];
  
  // Add search filter (farm name OR farmer name)
  if (filters?.search && filters.search.trim() !== '') {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(farms.name, searchTerm),
        like(farms.farmerName, searchTerm)
      )!
    );
  }
  
  // Add date range filter
  if (filters?.startDate) {
    conditions.push(gte(farms.registrationDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(farms.registrationDate, filters.endDate));
  }
  
  return await db.select().from(farms).where(and(...conditions));
}

export async function getFarmById(farmId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createFarm(farm: InsertFarm) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(farms).values(farm);
  return result.insertId;
}

export async function updateFarm(farmId: number, farm: Partial<InsertFarm>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(farms).set(farm).where(eq(farms.id, farmId));
}

export async function deleteFarm(farmId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(boundaries).where(eq(boundaries.farmId, farmId));
  await db.delete(yields).where(eq(yields.farmId, farmId));
  await db.delete(costs).where(eq(costs.farmId, farmId));
  await db.delete(farms).where(eq(farms.id, farmId));
}

// Boundaries
export async function getBoundariesByFarmId(farmId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(boundaries).where(eq(boundaries.farmId, farmId));
}

export async function saveBoundaries(farmId: number, boundaryData: Omit<InsertBoundary, 'farmId'>[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing boundaries
  await db.delete(boundaries).where(eq(boundaries.farmId, farmId));
  // Insert new boundaries
  if (boundaryData.length > 0) {
    await db.insert(boundaries).values(boundaryData.map(b => ({ ...b, farmId })));
  }
}

// Yields
export async function getYieldsByFarmId(farmId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(yields).where(eq(yields.farmId, farmId));
}

export async function createYield(yieldData: InsertYield) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(yields).values(yieldData);
  return result.insertId;
}

export async function deleteYield(yieldId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(yields).where(eq(yields.id, yieldId));
}

// Costs
export async function getCostsByFarmId(farmId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(costs).where(eq(costs.farmId, farmId));
}

export async function createCost(costData: InsertCost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(costs).values(costData);
  return result.insertId;
}

export async function deleteCost(costId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(costs).where(eq(costs.id, costId));
}
