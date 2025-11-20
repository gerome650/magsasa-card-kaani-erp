import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, text, decimal, timestamp, mysqlEnum, varchar, json, unique } from "drizzle-orm/mysql-core"
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
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "conversations_id"}),
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
