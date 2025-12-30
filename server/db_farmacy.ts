/**
 * Database functions for Farmacy feature
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { farmacyCases } from "../drizzle/schema";
import { randomUUID } from "crypto";

type InsertFarmacyCase = typeof farmacyCases.$inferInsert;

/**
 * Create a new farmacy case
 */
export async function createFarmacyCase(
  data: Omit<InsertFarmacyCase, "caseId" | "createdAt" | "updatedAt">
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const caseId = `farmacy_${randomUUID().replace(/-/g, "")}`;
  
  const result = await db.insert(farmacyCases).values({
    ...data,
    caseId,
  });

  return Number(result[0].insertId);
}

/**
 * Get farmacy case by ID
 */
export async function getFarmacyCase(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .select()
    .from(farmacyCases)
    .where(eq(farmacyCases.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get farmacy case by caseId
 */
export async function getFarmacyCaseByCaseId(caseId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .select()
    .from(farmacyCases)
    .where(eq(farmacyCases.caseId, caseId))
    .limit(1);

  return result[0] || null;
}
