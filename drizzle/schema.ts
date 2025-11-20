import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

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
  
  // Location fields (separate for better querying)
  barangay: varchar("barangay", { length: 255 }).notNull(),
  municipality: varchar("municipality", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  
  // Farm characteristics
  size: decimal("size", { precision: 10, scale: 2 }).notNull(), // Size in hectares
  crops: json("crops").$type<string[]>().notNull(), // Array of crop names
  soilType: varchar("soilType", { length: 100 }),
  irrigationType: mysqlEnum("irrigationType", ["Irrigated", "Rainfed", "Upland"]),
  photoUrls: json("photoUrls").$type<string[]>(), // Array of S3 photo URLs
  
  // Performance metrics
  averageYield: decimal("averageYield", { precision: 10, scale: 2 }), // MT/ha
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "fallow"]).default("active").notNull(),
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
  area: decimal("area", { precision: 10, scale: 2 }).notNull(), // Calculated area in hectares
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
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // Numeric value
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Numeric value
  parcelIndex: int("parcelIndex"), // null means applies to all parcels
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cost = typeof costs.$inferSelect;
export type InsertCost = typeof costs.$inferInsert;

// Conversations for KaAni AI assistant
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// Chat messages for KaAni AI assistant
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId").notNull(), // Foreign key to conversations table
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }), // rice_farming, loan, agscore, pest_control, market_prices, weather, general
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Batch Orders tables for Agri Input procurement
export const batchOrders = mysqlTable("batch_orders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  referenceCode: varchar("referenceCode", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "cancelled", "completed"]).default("draft").notNull(),
  supplierId: varchar("supplierId", { length: 36 }),
  inputType: mysqlEnum("inputType", ["fertilizer", "seed", "feed", "pesticide", "other"]),
  pricingMode: mysqlEnum("pricingMode", ["margin"]).default("margin").notNull(),
  currency: varchar("currency", { length: 10 }).default("PHP").notNull(),
  
  expectedDeliveryDate: varchar("expectedDeliveryDate", { length: 50 }).notNull(), // ISO date string
  deliveryWindowStart: timestamp("deliveryWindowStart"),
  deliveryWindowEnd: timestamp("deliveryWindowEnd"),
  
  // Financial totals (all computed on server)
  totalQuantity: decimal("totalQuantity", { precision: 15, scale: 2 }).default("0").notNull(),
  totalSupplierTotal: decimal("totalSupplierTotal", { precision: 15, scale: 2 }).default("0").notNull(),
  totalFarmerTotal: decimal("totalFarmerTotal", { precision: 15, scale: 2 }).default("0").notNull(),
  totalAgsenseRevenue: decimal("totalAgsenseRevenue", { precision: 15, scale: 2 }).default("0").notNull(),
  
  // Meta
  createdByUserId: int("createdByUserId").notNull(), // FK to users.id
  approvedByUserId: int("approvedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BatchOrder = typeof batchOrders.$inferSelect;
export type InsertBatchOrder = typeof batchOrders.$inferInsert;

export const batchOrderItems = mysqlTable("batch_order_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchOrderId: varchar("batchOrderId", { length: 36 }).notNull(), // FK to batch_orders.id
  farmId: int("farmId").notNull(), // FK to farms.id
  farmerId: int("farmerId"), // FK to users.id or nullable
  productId: varchar("productId", { length: 36 }), // FK to products table if exists
  inputType: mysqlEnum("inputType", ["fertilizer", "seed", "feed", "pesticide", "other"]),
  
  quantityOrdered: decimal("quantityOrdered", { precision: 15, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(), // kg, bag, sack, etc.
  
  // Pricing per line
  supplierUnitPrice: decimal("supplierUnitPrice", { precision: 15, scale: 2 }).notNull(),
  farmerUnitPrice: decimal("farmerUnitPrice", { precision: 15, scale: 2 }).notNull(),
  marginPerUnit: decimal("marginPerUnit", { precision: 15, scale: 2 }).notNull(),
  
  // Derived totals per line
  lineSupplierTotal: decimal("lineSupplierTotal", { precision: 15, scale: 2 }).notNull(),
  lineFarmerTotal: decimal("lineFarmerTotal", { precision: 15, scale: 2 }).notNull(),
  lineAgsenseRevenue: decimal("lineAgsenseRevenue", { precision: 15, scale: 2 }).notNull(),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BatchOrderItem = typeof batchOrderItems.$inferSelect;
export type InsertBatchOrderItem = typeof batchOrderItems.$inferInsert;
