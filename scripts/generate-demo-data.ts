import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users, farms, yields } from '../drizzle/schema';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Get database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = mysql.createPool(connectionString);
const db = drizzle(pool);

// Calauan, Laguna barangays
const BARANGAYS = [
  'San Isidro', 'Dayap', 'Lamot 1', 'Lamot 2', 'Balayhangin',
  'Kanluran Talaongan', 'Silangan Talaongan', 'Bubukal', 'Bungkol',
  'Calumpang', 'Dila', 'Masili', 'Palina', 'Poblacion 1', 'Poblacion 2',
  'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Santo Tomas', 'Talolong'
];

// Crop types
const CROP_TYPES = [
  'Palay (Rice)', 'Corn', 'Tomato', 'Eggplant', 'Okra', 'Pepper',
  'Cucumber', 'Squash', 'Banana', 'Cassava', 'Sweet Potato', 'Mango', 'Papaya'
];

// Soil types
const SOIL_TYPES = ['Clay Loam', 'Sandy Loam', 'Loam', 'Clay', 'Sandy'];

// Irrigation types
const IRRIGATION_TYPES = ['Irrigated', 'Rainfed', 'Upland'] as const;

// Filipino first names and last names
const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Pedro', 'Rosa', 'Carlos', 'Ana', 'Luis',
  'Carmen', 'Miguel', 'Isabel', 'Ricardo', 'Patricia', 'Fernando',
  'Roberto', 'Elena', 'Antonio', 'Rosa', 'Manuel', 'Dolores', 'Francisco',
  'Teresa', 'Ramon', 'Concepcion', 'Alfredo', 'Gloria', 'Vicente', 'Mercedes'
];

const LAST_NAMES = [
  'Santos', 'Cruz', 'Reyes', 'Garcia', 'Ramos', 'Torres', 'Lopez', 'Fernandez',
  'Gonzalez', 'Rivera', 'Diaz', 'Morales', 'Ortiz', 'Sanchez', 'Ramirez',
  'Flores', 'Gutierrez', 'Herrera', 'Jimenez', 'Villanueva', 'Martinez',
  'Mendoza', 'Castro', 'Aquino', 'Bautista', 'Del Rosario', 'Mendoza', 'Perez'
];

// Generate random number between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generate Filipino name
function generateName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

// Generate coordinates in Calauan, Laguna area
function generateCoordinates(): { lat: string; lng: string } {
  // Calauan approximate bounds
  const lat = randomFloat(14.1400, 14.1600, 6);
  const lng = randomFloat(121.3100, 121.3300, 6);
  return { lat: lat.toString(), lng: lng.toString() };
}

// Storyline 1: Yield improvement for intervention farmers (first 500 farmers)
const INTERVENTION_FARMER_IDS = new Set<number>();

// Storyline 2: Pest/flood events in specific barangays in Wet 2024
const AFFECTED_BARANGAYS = ['Dayap', 'Lamot 1', 'Balayhangin'];
const WET_2024_START = new Date('2024-06-01');
const WET_2024_END = new Date('2024-11-30');

// Storyline 3: Crop rotation group (every 10th farmer starting from 100)
const ROTATION_GROUP_START = 100;
const ROTATION_GROUP_INTERVAL = 10;

interface FarmerData {
  id: number;
  name: string;
  email: string;
  openId: string;
  barangay: string;
}

interface FarmData {
  id: number;
  userId: number;
  name: string;
  farmerName: string;
  barangay: string;
  municipality: string;
  latitude: string;
  longitude: string;
  size: string;
  crops: string;
  soilType: string;
  irrigationType: string;
  averageYield: string;
  status: 'active' | 'inactive' | 'fallow';
  registrationDate: string;
}

interface SeasonData {
  id: number;
  farmId: number;
  parcelIndex: number;
  cropType: string;
  harvestDate: string;
  quantity: string;
  unit: 'kg' | 'tons';
  qualityGrade: 'Premium' | 'Standard' | 'Below Standard';
}

async function generateDemoData() {
  console.log('🌱 Generating demo data for Calauan, Laguna...');
  
  const farmers: FarmerData[] = [];
  const farmsData: FarmData[] = [];
  const seasonsData: SeasonData[] = [];
  
  let farmerId = 1;
  let farmId = 1;
  let seasonId = 1;
  
  // Generate 2,500 farmers
  for (let i = 0; i < 2500; i++) {
    const name = generateName();
    const barangay = randomChoice(BARANGAYS);
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@calauan.local`;
    const openId = `demo-farmer-${farmerId}`;
    
    farmers.push({
      id: farmerId,
      name,
      email,
      openId,
      barangay,
    });
    
    // Storyline 1: Mark first 500 as intervention farmers
    if (farmerId <= 500) {
      INTERVENTION_FARMER_IDS.add(farmerId);
    }
    
    // Generate 1-3 farms per farmer
    const numFarms = randomInt(1, 3);
    for (let j = 0; j < numFarms; j++) {
      const coords = generateCoordinates();
      const numCrops = randomInt(1, 3);
      const crops = randomChoices(CROP_TYPES, 1, numCrops);
      const soilType = randomChoice(SOIL_TYPES);
      const irrigationType = randomChoice(IRRIGATION_TYPES);
      
      // Base yield varies by crop and irrigation
      let baseYield = 5.0;
      if (crops.includes('Palay (Rice)')) {
        baseYield = irrigationType === 'Irrigated' ? randomFloat(5.5, 7.0) : randomFloat(4.0, 5.5);
      } else if (crops.includes('Corn')) {
        baseYield = randomFloat(4.0, 5.0);
      } else if (crops.some(c => ['Tomato', 'Pepper', 'Eggplant'].includes(c))) {
        baseYield = randomFloat(10.0, 13.0);
      }
      
      // Storyline 1: Intervention farmers have improving yields
      if (INTERVENTION_FARMER_IDS.has(farmerId)) {
        baseYield *= randomFloat(1.1, 1.3); // 10-30% improvement
      }
      
      // Storyline 3: Crop rotation group has more stable yields
      const isRotationGroup = (farmerId >= ROTATION_GROUP_START && 
                               (farmerId - ROTATION_GROUP_START) % ROTATION_GROUP_INTERVAL === 0);
      if (isRotationGroup) {
        baseYield *= randomFloat(1.05, 1.15); // 5-15% more stable/higher
      }
      
      const farmName = `${name.split(' ')[1]} ${crops[0]} Farm ${j + 1 > 1 ? `#${j + 1}` : ''}`.trim();
      const registrationDate = new Date(2020 + randomInt(0, 4), randomInt(0, 11), randomInt(1, 28))
        .toISOString().split('T')[0];
      
      farmsData.push({
        id: farmId,
        userId: farmerId,
        name: farmName,
        farmerName: name,
        barangay,
        municipality: 'Calauan',
        latitude: coords.lat,
        longitude: coords.lng,
        size: randomFloat(0.5, 5.0).toString(),
        crops: JSON.stringify(crops),
        soilType,
        irrigationType,
        averageYield: baseYield.toFixed(2),
        status: 'active',
        registrationDate,
      });
      
      // Generate 2-4 seasons (yields) per farm
      const numSeasons = randomInt(2, 4);
      for (let k = 0; k < numSeasons; k++) {
        // Generate dates from 2022 to 2024
        const year = 2022 + randomInt(0, 2);
        const month = randomInt(1, 12);
        const day = randomInt(1, 28);
        const harvestDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const seasonDate = new Date(harvestDate);
        const isWet2024 = seasonDate >= WET_2024_START && seasonDate <= WET_2024_END;
        const isAffectedBarangay = AFFECTED_BARANGAYS.includes(barangay);
        
        // Base quantity calculation
        const farmSize = parseFloat(farmsData[farmsData.length - 1].size);
        const yieldPerHectare = parseFloat(farmsData[farmsData.length - 1].averageYield);
        let quantity = farmSize * yieldPerHectare;
        
        // Storyline 2: Pest/flood events in specific barangays in Wet 2024
        if (isWet2024 && isAffectedBarangay && Math.random() < 0.6) {
          quantity *= randomFloat(0.3, 0.7); // 30-70% reduction due to pest/flood
        }
        
        // Storyline 1: Intervention farmers show improvement over time
        if (INTERVENTION_FARMER_IDS.has(farmerId) && year >= 2023) {
          quantity *= randomFloat(1.05, 1.25); // 5-25% improvement in later years
        }
        
        // Convert to tons if > 1000 kg
        const unit = quantity > 1000 ? 'tons' : 'kg';
        const finalQuantity = unit === 'tons' ? (quantity / 1000) : quantity;
        
        // Quality grade based on yield
        let qualityGrade: 'Premium' | 'Standard' | 'Below Standard';
        const yieldRatio = finalQuantity / (farmSize * yieldPerHectare);
        if (yieldRatio > 0.9) {
          qualityGrade = 'Premium';
        } else if (yieldRatio > 0.7) {
          qualityGrade = 'Standard';
        } else {
          qualityGrade = 'Below Standard';
        }
        
        seasonsData.push({
          id: seasonId,
          farmId,
          parcelIndex: 0, // Default to 0 for single parcel farms
          cropType: crops[0], // Use primary crop
          harvestDate,
          quantity: finalQuantity.toFixed(2),
          unit,
          qualityGrade,
        });
        
        seasonId++;
      }
      
      farmId++;
    }
    
    farmerId++;
    
    if ((i + 1) % 500 === 0) {
      console.log(`✅ Generated ${i + 1} farmers...`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Farmers: ${farmers.length}`);
  console.log(`   Farms: ${farmsData.length}`);
  console.log(`   Seasons (Yields): ${seasonsData.length}`);
  
  // Write CSV files
  console.log('\n📝 Writing CSV files...');
  
  // Farmers CSV
  const farmersCsv = [
    'id,name,email,openId,barangay',
    ...farmers.map(f => `${f.id},"${f.name}","${f.email}","${f.openId}","${f.barangay}"`)
  ].join('\n');
  writeFileSync(join(process.cwd(), 'docs', 'demo_farmers.csv'), farmersCsv);
  console.log('   ✅ docs/demo_farmers.csv');
  
  // Farms CSV
  const farmsCsv = [
    'id,userId,name,farmerName,barangay,municipality,latitude,longitude,size,crops,soilType,irrigationType,averageYield,status,registrationDate',
    ...farmsData.map(f => 
      `${f.id},${f.userId},"${f.name}","${f.farmerName}","${f.barangay}","${f.municipality}",${f.latitude},${f.longitude},${f.size},"${f.crops}",${f.soilType || ''},"${f.irrigationType}",${f.averageYield},"${f.status}","${f.registrationDate}"`
    )
  ].join('\n');
  writeFileSync(join(process.cwd(), 'docs', 'demo_farms.csv'), farmsCsv);
  console.log('   ✅ docs/demo_farms.csv');
  
  // Seasons CSV
  const seasonsCsv = [
    'id,farmId,parcelIndex,cropType,harvestDate,quantity,unit,qualityGrade',
    ...seasonsData.map(s => 
      `${s.id},${s.farmId},${s.parcelIndex},"${s.cropType}","${s.harvestDate}",${s.quantity},"${s.unit}","${s.qualityGrade}"`
    )
  ].join('\n');
  writeFileSync(join(process.cwd(), 'docs', 'demo_seasons.csv'), seasonsCsv);
  console.log('   ✅ docs/demo_seasons.csv');
  
  // Insert into database
  console.log('\n💾 Inserting into database...');
  
  try {
    // Check if demo data already exists
    const existingUsers = await db.select({ id: users.id })
      .from(users)
      .where(sql`${users.openId} LIKE 'demo-farmer-%'`)
      .limit(1);
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Demo data already exists in database.');
      console.log('💡 To re-generate, delete existing demo data first:');
      console.log('   DELETE FROM yields WHERE farmId IN (SELECT id FROM farms WHERE userId IN (SELECT id FROM users WHERE openId LIKE "demo-farmer-%"));');
      console.log('   DELETE FROM farms WHERE userId IN (SELECT id FROM users WHERE openId LIKE "demo-farmer-%");');
      console.log('   DELETE FROM users WHERE openId LIKE "demo-farmer-%";');
      console.log('\n✅ CSV files have been generated and saved to docs/');
      await pool.end();
      process.exit(0);
    }
    
    // Insert users (farmers) in batches for better performance
    console.log('   Inserting farmers (users)...');
    const userIdMap = new Map<string, number>();
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < farmers.length; i += batchSize) {
      const batch = farmers.slice(i, i + batchSize);
      const values = batch.map(farmer => ({
        openId: farmer.openId,
        name: farmer.name,
        email: farmer.email,
        loginMethod: 'demo' as const,
        role: 'user' as const,
      }));
      
      // Insert batch
      await db.insert(users).values(values);
      
      // Query back the inserted users to get their IDs
      // Query only the batch we just inserted by matching openIds
      const openIds = values.map(v => v.openId);
      const allUsers = await db.select({ id: users.id, openId: users.openId })
        .from(users);
      const insertedBatch = allUsers.filter(u => 
        u.openId && openIds.includes(u.openId)
      );
      
      // Map openId to id
      for (const user of insertedBatch) {
        if (user.openId) {
          userIdMap.set(user.openId, user.id);
        }
      }
      
      if ((i + batchSize) % 500 === 0 || i + batchSize >= farmers.length) {
        console.log(`   ✅ Inserted ${Math.min(i + batchSize, farmers.length)}/${farmers.length} farmers...`);
      }
    }
    console.log(`   ✅ Inserted ${farmers.length} farmers`);
    
    // Insert farms in batches
    console.log('   Inserting farms...');
    const farmIdMap = new Map<number, number>();
    
    const farmBatchSize = 100;
    for (let i = 0; i < farmsData.length; i += farmBatchSize) {
      const batch = farmsData.slice(i, i + farmBatchSize);
      const values = batch.map(farm => {
        const openId = `demo-farmer-${farm.userId}`;
        const userId = userIdMap.get(openId);
        if (!userId) {
          console.warn(`   ⚠️  User ID not found for farmer ${farm.userId} (openId: ${openId})`);
          return null;
        }
        return {
          userId,
          name: farm.name,
          farmerName: farm.farmerName,
          barangay: farm.barangay,
          municipality: farm.municipality,
          latitude: farm.latitude,
          longitude: farm.longitude,
          size: farm.size,
          crops: farm.crops,
          soilType: farm.soilType || null,
          irrigationType: farm.irrigationType,
          averageYield: farm.averageYield || null,
          status: farm.status,
          registrationDate: farm.registrationDate,
        };
      }).filter((v): v is NonNullable<typeof v> => v !== null);
      
      if (values.length === 0) {
        console.warn(`   ⚠️  Skipping batch ${i} - no valid farms`);
        continue;
      }
      
      // Insert batch
      await db.insert(farms).values(values);
      
      // Query back the inserted farms to get their IDs
      // Use a simpler approach: query all and filter
      const allFarms = await db.select({ id: farms.id, name: farms.name, farmerName: farms.farmerName })
        .from(farms);
      const insertedBatch = allFarms.filter(f => 
        values.some(v => v.name === f.name && v.farmerName === f.farmerName)
      );
      
      // Map our farm ID to database ID
      for (let j = 0; j < batch.length; j++) {
        const farm = batch[j];
        const dbFarm = insertedBatch.find(f => f.name === farm.name && f.farmerName === farm.farmerName);
        if (dbFarm) {
          farmIdMap.set(farm.id, dbFarm.id);
        }
      }
      
      if ((i + farmBatchSize) % 500 === 0 || i + farmBatchSize >= farmsData.length) {
        console.log(`   ✅ Inserted ${Math.min(i + farmBatchSize, farmsData.length)}/${farmsData.length} farms...`);
      }
    }
    console.log(`   ✅ Inserted ${farmsData.length} farms`);
    
    // Insert yields (seasons) in batches
    console.log('   Inserting seasons (yields)...');
    let insertedSeasons = 0;
    
    const seasonBatchSize = 200;
    for (let i = 0; i < seasonsData.length; i += seasonBatchSize) {
      const batch = seasonsData.slice(i, i + seasonBatchSize);
      const values = batch.map(season => {
        const dbFarmId = farmIdMap.get(season.farmId);
        if (!dbFarmId) {
          return null;
        }
        return {
          farmId: dbFarmId,
          parcelIndex: season.parcelIndex,
          cropType: season.cropType,
          harvestDate: season.harvestDate,
          quantity: season.quantity,
          unit: season.unit,
          qualityGrade: season.qualityGrade,
        };
      }).filter((v): v is NonNullable<typeof v> => v !== null);
      
      if (values.length === 0) {
        console.warn(`   ⚠️  Skipping batch ${i} - no valid seasons`);
        continue;
      }
      
      // Insert batch
      await db.insert(yields).values(values);
      insertedSeasons += values.length;
      
      if ((i + seasonBatchSize) % 1000 === 0 || i + seasonBatchSize >= seasonsData.length) {
        console.log(`   ✅ Inserted ${Math.min(i + seasonBatchSize, seasonsData.length)}/${seasonsData.length} seasons...`);
      }
    }
    console.log(`   ✅ Inserted ${insertedSeasons} seasons (yields)`);
    
    console.log('\n🎉 Demo data generation complete!');
    console.log(`\n📁 CSV files saved to:`);
    console.log(`   - docs/demo_farmers.csv`);
    console.log(`   - docs/demo_farms.csv`);
    console.log(`   - docs/demo_seasons.csv`);
    
  } catch (error) {
    console.error('❌ Error inserting into database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the generator
generateDemoData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

