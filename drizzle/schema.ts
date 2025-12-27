import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, text, decimal, timestamp, mysqlEnum, varchar, json, unique, char, index, foreignKey } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const boundaries = mysqlTable("boundaries", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	parcelIndex: int().notNull(),
	geoJson: text().notNull(),
	area: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "boundaries_id"}),
]);

export const chatMessages = mysqlTable("chatMessages", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	role: mysqlEnum(['user','assistant']).notNull(),
	content: text().notNull(),
	category: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	conversationId: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "chatMessages_id"}),
]);

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	farmerProfileId: char("farmer_profile_id", { length: 36 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "conversations_id"}),
	index("conversations_farmer_profile_id_idx").on(table.farmerProfileId),
]);

export const costs = mysqlTable("costs", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	date: varchar({ length: 50 }).notNull(),
	category: mysqlEnum(['Fertilizer','Pesticides','Seeds','Labor','Equipment','Other']).notNull(),
	description: text(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	parcelIndex: int(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "costs_id"}),
]);

export const farms = mysqlTable("farms", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	farmerName: varchar({ length: 255 }).notNull(),
	latitude: decimal({ precision: 10, scale: 6 }).notNull(),
	longitude: decimal({ precision: 10, scale: 6 }).notNull(),
	size: decimal({ precision: 10, scale: 2 }).notNull(),
	crops: json().notNull(),
	status: mysqlEnum(['active','inactive','fallow']).default('active').notNull(),
	registrationDate: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	barangay: varchar({ length: 255 }).notNull(),
	municipality: varchar({ length: 255 }).notNull(),
	soilType: varchar({ length: 100 }),
	irrigationType: mysqlEnum(['Irrigated','Rainfed','Upland']),
	averageYield: decimal({ precision: 10, scale: 2 }),
	photoUrls: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "farms_id"}),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_openId_unique").on(table.openId),
]);

export const yields = mysqlTable("yields", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	parcelIndex: int().notNull(),
	cropType: varchar({ length: 100 }).notNull(),
	harvestDate: varchar({ length: 50 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unit: mysqlEnum(['kg','tons']).notNull(),
	qualityGrade: mysqlEnum(['Premium','Standard','Below Standard']).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "yields_id"}),
]);

export const farmerProfiles = mysqlTable("farmer_profiles", {
	farmerProfileId: char("farmer_profile_id", { length: 36 }).notNull(),
	createdByUserId: int("created_by_user_id"),
	province: varchar({ length: 255 }),
	municipality: varchar({ length: 255 }),
	barangay: varchar({ length: 255 }),
	cropPrimary: varchar({ length: 100 }),
	averageYield: decimal({ precision: 10, scale: 2 }),
	soilType: varchar({ length: 100 }),
	irrigationType: mysqlEnum(['Irrigated','Rainfed','Upland']),
	farmSize: decimal({ precision: 10, scale: 2 }),
	inputs: json(),
	prices: json(),
	additionalContext: json(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.farmerProfileId], name: "farmer_profiles_farmer_profile_id"}),
	index("farmer_profiles_created_by_user_id_idx").on(table.createdByUserId),
	index("farmer_profiles_location_idx").on(table.province, table.municipality, table.barangay),
	index("farmer_profiles_crop_primary_idx").on(table.cropPrimary),
]);

export const kaaniRecommendations = mysqlTable("kaani_recommendations", {
	id: int().autoincrement().notNull(),
	farmerProfileId: char("farmer_profile_id", { length: 36 }).notNull(),
	recommendationText: text().notNull(),
	recommendationType: varchar({ length: 100 }),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "kaani_recommendations_id"}),
	index("kaani_recommendations_farmer_profile_id_idx").on(table.farmerProfileId),
	foreignKey({
		columns: [table.farmerProfileId],
		foreignColumns: [farmerProfiles.farmerProfileId],
		name: "kaani_recommendations_farmer_profile_id_fk"
	}).onDelete("restrict"),
]);

export const identityLinks = mysqlTable("identity_links", {
	id: int().autoincrement().notNull(),
	farmerProfileId: char("farmer_profile_id", { length: 36 }).notNull(),
	partner: mysqlEnum("partner", ['card_mri', 'marketplace', 'other']).notNull(),
	partnerFarmerRef: varchar("partner_farmer_ref", { length: 255 }).notNull(),
	linkMethod: mysqlEnum("link_method", ['Manual', 'API', 'Import', 'Bulk']).notNull(),
	consentObtained: int("consent_obtained").default(0).notNull(),
	consentTextVersion: varchar("consent_text_version", { length: 50 }),
	consentTimestamp: timestamp("consent_timestamp", { mode: 'string' }),
	consentActorUserId: int("consent_actor_user_id"),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "identity_links_id"}),
	index("identity_links_farmer_profile_id_idx").on(table.farmerProfileId),
	index("identity_links_partner_farmer_ref_idx").on(table.partner, table.partnerFarmerRef),
	unique("identity_links_farmer_profile_id_partner_partner_farmer_ref_unique").on(table.farmerProfileId, table.partner, table.partnerFarmerRef),
	foreignKey({
		columns: [table.farmerProfileId],
		foreignColumns: [farmerProfiles.farmerProfileId],
		name: "identity_links_farmer_profile_id_fk"
	}).onDelete("restrict"),
]);

export const conversationMessages = mysqlTable("conversation_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int("conversation_id").notNull(),
	role: mysqlEnum("role", ['user', 'assistant', 'system', 'tool']).notNull(),
	content: text().notNull(),
	metadata: json("metadata"),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "conversation_messages_id"}),
	index("idx_cm_conversation_created").on(table.conversationId, table.createdAt),
]);

export const kaaniLeads = mysqlTable("kaani_leads", {
	id: int().autoincrement().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	source: mysqlEnum("source", ['public', 'erp']).default('public').notNull(),
	audience: mysqlEnum("audience", ['loan_officer', 'farmer']).notNull(),
	dialect: varchar("dialect", { length: 20 }),
	conversationId: int("conversation_id"),
	farmerProfileId: char("farmer_profile_id", { length: 36 }),
	sessionToken: char("session_token", { length: 64 }).notNull(),
	landingPath: varchar("landing_path", { length: 255 }),
	utmSource: varchar("utm_source", { length: 100 }),
	utmMedium: varchar("utm_medium", { length: 100 }),
	utmCampaign: varchar("utm_campaign", { length: 100 }),
	consentObtained: int("consent_obtained").default(0).notNull(),
	consentTextVersion: varchar("consent_text_version", { length: 50 }),
	consentTimestamp: timestamp("consent_timestamp", { mode: 'string' }),
	capturedName: varchar("captured_name", { length: 255 }),
	capturedEmail: varchar("captured_email", { length: 255 }),
	capturedPhone: varchar("captured_phone", { length: 50 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "kaani_leads_id"}),
	index("idx_leads_session_token").on(table.sessionToken),
	index("idx_leads_conversation_id").on(table.conversationId),
	index("idx_leads_farmer_profile_id").on(table.farmerProfileId),
	index("idx_leads_createdAt").on(table.createdAt),
	unique("kaani_leads_session_token_unique").on(table.sessionToken),
]);
