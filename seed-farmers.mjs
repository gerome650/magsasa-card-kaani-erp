import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users, farms, boundaries, yields, costs } from './drizzle/schema.ts';
import fs from 'fs';

// Read the generated data
const data = JSON.parse(fs.readFileSync('/home/ubuntu/farmers_data.json', 'utf-8'));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = mysql.createPool(connectionString);
const db = drizzle(pool);

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (in reverse order of foreign keys)
    console.log('🗑️  Clearing existing data...');
    await db.delete(costs);
    await db.delete(yields);
    await db.delete(boundaries);
    await db.delete(farms);
    
    // Delete only farmer users (keep admin/manager/field_officer accounts)
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE role NOT IN ("admin", "user")');
    if (existingUsers.length > 0) {
      for (const user of existingUsers) {
        await db.delete(users).where({ id: user.id });
      }
    }

    // Insert farmers as users
    console.log(`👨‍🌾 Inserting ${data.farmers.length} farmers...`);
    const farmerIdMap = new Map();
    
    for (const farmer of data.farmers) {
      const [result] = await db.insert(users).values({
        openId: `farmer_${farmer.farmerId}_${Date.now()}_${Math.random()}`,
        name: farmer.name,
        email: farmer.email,
        loginMethod: 'oauth',
        role: 'user', // Using 'user' role as 'farmer' is not in the enum
      });
      
      farmerIdMap.set(farmer.id, result.insertId);
    }

    // Insert farms
    console.log(`🚜 Inserting ${data.farms.length} farms...`);
    const farmIdMap = new Map();
    
    for (const farm of data.farms) {
      const userId = farmerIdMap.get(farm.farmerId);
      const farmerData = data.farmers.find(f => f.id === farm.farmerId);
      
      const [result] = await db.insert(farms).values({
        userId: userId,
        name: farm.name,
        farmerName: farmerData.name,
        barangay: farm.location.split(',')[0].trim(),
        municipality: farm.location.split(',')[1]?.trim() || farm.province,
        latitude: farm.coordinates.lat.toString(),
        longitude: farm.coordinates.lng.toString(),
        size: farm.size.toString(),
        crops: farm.crops.split(', '),
        soilType: farm.soilType,
        irrigationType: farm.irrigationType === 'Partial Irrigation' ? 'Irrigated' : farm.irrigationType,
        status: 'active',
      });
      
      const farmId = result.insertId;
      farmIdMap.set(farm.farmerId, farmId);
      
      // Insert boundary for this farm
      // Convert boundary array to GeoJSON polygon
      const geoJson = {
        type: 'Polygon',
        coordinates: [[
          ...farm.boundary.map(point => [point.lng, point.lat]),
          [farm.boundary[0].lng, farm.boundary[0].lat] // Close the polygon
        ]]
      };
      
      await db.insert(boundaries).values({
        farmId: farmId,
        parcelIndex: 0,
        geoJson: JSON.stringify(geoJson),
        area: farm.size.toString(),
      });
    }

    // Insert harvests (yields)
    console.log(`🌾 Inserting ${data.harvests.length} harvest records...`);
    for (const harvest of data.harvests) {
      const farmId = farmIdMap.get(harvest.farmerId);
      
      // Map unit to schema enum (kg or tons)
      let unit = 'tons';
      let quantity = harvest.quantity;
      if (harvest.unit === 'nuts') {
        // Convert nuts to kg (approximate: 1 nut ≈ 1.5 kg)
        quantity = (harvest.quantity * 1.5) / 1000; // Convert to tons
        unit = 'tons';
      } else if (harvest.unit === 'MT') {
        unit = 'tons';
      }
      
      // Map quality to schema enum
      let qualityGrade = 'Standard';
      if (harvest.quality === 'Premium') qualityGrade = 'Premium';
      else if (harvest.quality === 'Grade C') qualityGrade = 'Below Standard';
      
      await db.insert(yields).values({
        farmId: farmId,
        parcelIndex: 0,
        cropType: harvest.crop,
        harvestDate: harvest.harvestDate,
        quantity: quantity.toString(),
        unit: unit,
        qualityGrade: qualityGrade,
      });
    }

    // Insert costs
    console.log(`💰 Inserting ${data.costs.length} cost records...`);
    for (const cost of data.costs) {
      const farmId = farmIdMap.get(cost.farmerId);
      
      // Map category to schema enum
      let category = 'Other';
      if (cost.category === 'Fertilizer') category = 'Fertilizer';
      else if (cost.category === 'Pesticide') category = 'Pesticides';
      else if (cost.category === 'Seeds') category = 'Seeds';
      else if (cost.category === 'Labor') category = 'Labor';
      else if (cost.category === 'Equipment') category = 'Equipment';
      
      await db.insert(costs).values({
        farmId: farmId,
        date: cost.date,
        category: category,
        description: cost.description,
        amount: cost.amount.toString(),
        parcelIndex: 0,
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Farmers: ${data.farmers.length}`);
    console.log(`   - Farms: ${data.farms.length}`);
    console.log(`   - Harvests: ${data.harvests.length}`);
    console.log(`   - Costs: ${data.costs.length}`);
    console.log(`   - Bacolod farmers: ${data.metadata.bacolod_farmers}`);
    console.log(`   - Laguna farmers: ${data.metadata.laguna_farmers}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
