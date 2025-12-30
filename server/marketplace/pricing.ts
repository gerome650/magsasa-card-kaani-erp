/**
 * Marketplace pricing module (read-only, tenant-aware)
 */

import { eq, and, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { priceLists, priceListItems, products } from "../../drizzle/schema";

export interface PricingContext {
  tenantId?: string | null;
  deploymentProfile?: string;
}

/**
 * Get active price list for tenant/deployment
 * 
 * Selection logic:
 * 1. Match tenantId if provided
 * 2. Match deploymentProfile if provided
 * 3. Prefer most recent valid price list
 * 4. Return null if no active price list found
 */
export async function getActivePriceList(context?: PricingContext) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const conditions = [eq(priceLists.active, 1)];

  // Tenant scoping
  if (context?.tenantId) {
    conditions.push(eq(priceLists.tenantId, context.tenantId));
  } else if (context?.deploymentProfile) {
    // Fallback to deployment profile if no tenant
    conditions.push(eq(priceLists.deploymentProfile, context.deploymentProfile));
  }

  // Date validity (if validFrom/validUntil are set)
  const now = new Date().toISOString();
  conditions.push(
    or(
      sql`${priceLists.validFrom} IS NULL`,
      sql`${priceLists.validFrom} <= ${now}`
    )!
  );
  conditions.push(
    or(
      sql`${priceLists.validUntil} IS NULL`,
      sql`${priceLists.validUntil} >= ${now}`
    )!
  );

  const result = await db
    .select()
    .from(priceLists)
    .where(and(...conditions))
    .orderBy(sql`${priceLists.createdAt} DESC`)
    .limit(1);

  return result[0] || null;
}

/**
 * Get price list items for a price list
 */
export async function getPriceListItems(priceListId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  const result = await db
    .select({
      id: priceListItems.id,
      priceListId: priceListItems.priceListId,
      productId: priceListItems.productId,
      price: priceListItems.price,
      currency: priceListItems.currency,
      unit: priceListItems.unit,
      notes: priceListItems.notes,
      product: {
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        description: products.description,
        category: products.category,
        unit: products.unit,
      },
    })
    .from(priceListItems)
    .innerJoin(products, eq(priceListItems.productId, products.id))
    .where(eq(priceListItems.priceListId, priceListId))
    .orderBy(products.name);

  return result;
}

/**
 * Get active price list with items (convenience function)
 * Returns null if no active price list exists
 */
export async function getActivePriceListWithItems(context?: PricingContext) {
  const priceList = await getActivePriceList(context);
  if (!priceList) {
    return null;
  }

  const items = await getPriceListItems(priceList.id);

  return {
    priceList,
    items,
  };
}

/**
 * Get price for a specific product from active price list
 * Returns null if no active price list or product not in price list
 */
export async function getProductPrice(
  productId: number,
  context?: PricingContext
) {
  const priceList = await getActivePriceList(context);
  if (!priceList) {
    return null;
  }

  const result = await db
    .select()
    .from(priceListItems)
    .where(
      and(
        eq(priceListItems.priceListId, priceList.id),
        eq(priceListItems.productId, productId)
      )
    )
    .limit(1);

  return result[0] || null;
}

