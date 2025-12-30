/**
 * Marketplace products module (read-only)
 */

import { eq, and, or, like, sql } from "drizzle-orm";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";

export interface ProductFilters {
  q?: string; // Search query
  category?: string;
  active?: boolean;
}

/**
 * List products with optional filters
 */
export async function listProducts(filters?: ProductFilters) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const conditions = [];

  // Active filter (default to active only)
  if (filters?.active !== false) {
    conditions.push(eq(products.active, 1));
  }

  // Search query (name or description)
  if (filters?.q) {
    const searchTerm = `%${filters.q}%`;
    conditions.push(
      or(
        like(products.name, searchTerm),
        like(products.description, searchTerm)
      )!
    );
  }

  // Category filter
  if (filters?.category) {
    conditions.push(eq(products.category, filters.category));
  }

  const result = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(products.name);

  return result;
}

/**
 * Get product by ID
 */
export async function getProduct(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get product by product code
 */
export async function getProductByCode(productCode: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .select()
    .from(products)
    .where(eq(products.productCode, productCode))
    .limit(1);

  return result[0] || null;
}

/**
 * Get distinct categories
 */
export async function getCategories() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.active, 1));

  return result
    .map((r) => r.category)
    .filter((cat): cat is string => cat !== null && cat !== undefined);
}

