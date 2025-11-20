/**
 * QA Pass 3 & 5: Heavy Farm Generator
 * 
 * Generates a single farm with many yields and costs for load testing,
 * consistency verification, and failure/resilience testing of Farm Detail View.
 * 
 * Usage: 
 *   pnpm generate:heavy-farm
 *   pnpm tsx scripts/generate-heavy-farm.ts
 * 
 * Environment variables (optional):
 *   YIELDS_COUNT - Number of yield records to generate (default: 200)
 *   COSTS_COUNT - Number of cost records to generate (default: 150)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { farms, yields, costs, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not set in .env");
}

async function generateHeavyFarm() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("[HeavyFarm] Starting heavy farm generation...");

  try {
    // Find or create a demo user
    const existingUsers = await db.select().from(users).limit(1);
    let userId: number;
    
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`[HeavyFarm] Using existing user ID: ${userId}`);
    } else {
      // Create a demo user if none exists
      const result = await db.insert(users).values({
        openId: `demo-user-${Date.now()}`,
        name: "Demo Heavy Farm User",
        email: "heavy-farm-demo@example.com",
        loginMethod: "demo",
        role: "user",
      });
      userId = Number(result[0].insertId);
      console.log(`[HeavyFarm] Created demo user ID: ${userId}`);
    }

    // Create a farm
    const farmResult = await db.insert(farms).values({
      userId,
      name: "Heavy Test Farm - QA Pass 3",
      farmerName: "Heavy Farm Demo Farmer",
      latitude: "14.1500",
      longitude: "121.1167",
      size: "5.5",
      crops: JSON.stringify(["Rice", "Corn", "Vegetables"]),
      status: "active",
      barangay: "Calauan",
      municipality: "Calauan",
      soilType: "Loam",
      irrigationType: "Irrigated",
      averageYield: "4.5",
    });

    const farmId = Number(farmResult[0].insertId);
    console.log(`[HeavyFarm] Created farm ID: ${farmId}`);

    // QA Pass 5: Configurable record counts for oversized dataset testing
    const yieldsCount = parseInt(process.env.YIELDS_COUNT || "200", 10);
    const costsCount = parseInt(process.env.COSTS_COUNT || "150", 10);
    console.log(`[HeavyFarm] Generating ${yieldsCount} yields and ${costsCount} costs`);

    // Generate yield records
    const yieldRecords = [];
    const crops = ["Rice", "Corn", "Vegetables"];
    const units = ["kg", "tons"] as const;
    const qualityGrades = ["Premium", "Standard", "Below Standard"] as const;
    
    for (let i = 0; i < yieldsCount; i++) {
      const harvestDate = new Date();
      harvestDate.setDate(harvestDate.getDate() - Math.floor(Math.random() * 365 * 2)); // Last 2 years
      
      const crop = crops[Math.floor(Math.random() * crops.length)];
      const unit = units[Math.floor(Math.random() * units.length)];
      const quantity = unit === "tons" 
        ? (Math.random() * 10 + 1).toFixed(2) // 1-11 tons
        : (Math.random() * 10000 + 1000).toFixed(2); // 1000-11000 kg
      const qualityGrade = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
      const parcelIndex = Math.floor(Math.random() * 3); // 0-2 parcels
      
      yieldRecords.push({
        farmId,
        parcelIndex,
        cropType: crop,
        harvestDate: harvestDate.toISOString().split('T')[0],
        quantity: quantity.toString(), // Schema expects decimal (string)
        unit,
        qualityGrade,
      });
    }

    // Batch insert yields (50 at a time)
    console.log(`[HeavyFarm] Inserting ${yieldRecords.length} yield records...`);
    for (let i = 0; i < yieldRecords.length; i += 50) {
      const batch = yieldRecords.slice(i, i + 50);
      await db.insert(yields).values(batch);
      console.log(`[HeavyFarm] Inserted yields ${i + 1}-${Math.min(i + 50, yieldRecords.length)}`);
    }

    // Generate cost records
    const costRecords = [];
    const categories = ["Fertilizer", "Pesticides", "Seeds", "Labor", "Equipment", "Other"] as const;
    
    for (let i = 0; i < costsCount; i++) {
      const costDate = new Date();
      costDate.setDate(costDate.getDate() - Math.floor(Math.random() * 365 * 2)); // Last 2 years
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = (Math.random() * 5000 + 100).toFixed(2); // 100-5100 PHP
      const parcelIndex = Math.random() > 0.3 ? Math.floor(Math.random() * 3) : null; // 30% apply to all parcels
      const description = `${category} expense for ${parcelIndex !== null ? `Parcel ${parcelIndex + 1}` : 'all parcels'}`;
      
      costRecords.push({
        farmId,
        date: costDate.toISOString().split('T')[0],
        category,
        description: description || null,
        amount: amount.toString(), // Schema expects decimal (string)
        parcelIndex,
      });
    }

    // Batch insert costs (50 at a time)
    console.log(`[HeavyFarm] Inserting ${costRecords.length} cost records...`);
    for (let i = 0; i < costRecords.length; i += 50) {
      const batch = costRecords.slice(i, i + 50);
      await db.insert(costs).values(batch);
      console.log(`[HeavyFarm] Inserted costs ${i + 1}-${Math.min(i + 50, costRecords.length)}`);
    }

    console.log(`[HeavyFarm] ✅ Heavy farm created successfully!`);
    console.log(`[HeavyFarm] Farm ID: ${farmId}`);
    console.log(`[HeavyFarm] Yields: ${yieldRecords.length}`);
    console.log(`[HeavyFarm] Costs: ${costRecords.length}`);
    console.log(`[HeavyFarm] View at: /farms/${farmId}`);

  } catch (error) {
    console.error("[HeavyFarm] Error generating heavy farm:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

generateHeavyFarm()
  .then(() => {
    console.log("[HeavyFarm] Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[HeavyFarm] Script failed:", error);
    process.exit(1);
  });

