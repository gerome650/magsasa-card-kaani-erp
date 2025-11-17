import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Farm management tables
export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the farm
  name: varchar("name", { length: 255 }).notNull(),
  farmerName: varchar("farmerName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  size: varchar("size", { length: 100 }), // Entered size (e.g., "2.5 hectares")
  crops: text("crops"), // Comma-separated crop types
  status: mysqlEnum("status", ["Active", "Inactive", "Pending"]).default("Active").notNull(),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;

// Farm boundaries (parcels) - stores GeoJSON polygons
export const boundaries = mysqlTable("boundaries", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  parcelIndex: int("parcelIndex").notNull(), // 0, 1, 2... for multiple parcels
  geoJson: text("geoJson").notNull(), // Full GeoJSON polygon
  area: varchar("area", { length: 50 }).notNull(), // Calculated area in hectares
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Boundary = typeof boundaries.$inferSelect;
export type InsertBoundary = typeof boundaries.$inferInsert;

// Yield records
export const yields = mysqlTable("yields", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  parcelIndex: int("parcelIndex").notNull(),
  cropType: varchar("cropType", { length: 100 }).notNull(),
  harvestDate: varchar("harvestDate", { length: 50 }).notNull(), // ISO date string
  quantity: varchar("quantity", { length: 50 }).notNull(), // Numeric value as string
  unit: mysqlEnum("unit", ["kg", "tons"]).notNull(),
  qualityGrade: mysqlEnum("qualityGrade", ["Premium", "Standard", "Below Standard"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Yield = typeof yields.$inferSelect;
export type InsertYield = typeof yields.$inferInsert;

// Cost records
export const costs = mysqlTable("costs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  date: varchar("date", { length: 50 }).notNull(), // ISO date string
  category: mysqlEnum("category", ["Fertilizer", "Pesticides", "Seeds", "Labor", "Equipment", "Other"]).notNull(),
  description: text("description"),
  amount: varchar("amount", { length: 50 }).notNull(), // Numeric value as string
  parcelIndex: int("parcelIndex"), // null means applies to all parcels
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cost = typeof costs.$inferSelect;
export type InsertCost = typeof costs.$inferInsert;