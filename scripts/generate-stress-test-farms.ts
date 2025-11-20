import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { farms } from '../drizzle/schema';
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

const SOIL_TYPES = ['Clay Loam', 'Sandy Loam', 'Loam', 'Clay', 'Sandy'];
const IRRIGATION_TYPES = ['Irrigated', 'Rainfed', 'Upland'] as const;
const STATUSES = ['active', 'inactive', 'fallow'] as const;

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function pickRandom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

// Generate random coordinates in Calauan, Laguna area
function generateCoordinates(): { lat: string; lng: string } {
  // Calauan, Laguna approximate bounds
  const latMin = 14.0;
  const latMax = 14.3;
  const lngMin = 121.0;
  const lngMax = 121.5;
  
  return {
    lat: randomFloat(latMin, latMax, 6),
    lng: randomFloat(lngMin, lngMax, 6),
  };
}

// Generate farm name
function generateFarmName(farmerName: string, index: number): string {
  const suffixes = ['Farm', 'Fields', 'Plantation', 'Estate', 'Acres', 'Lands'];
  return `${farmerName}'s ${pickRandom(suffixes)} ${index > 0 ? index + 1 : ''}`.trim();
}

async function generateStressTestFarms(numFarms: number) {
  console.log(`\n🚀 Generating ${numFarms} stress test farms...\n`);

  // Get existing users to assign farms to
  const existingUsers = await db.select({ id: farms.userId, farmerName: farms.farmerName })
    .from(farms)
    .limit(1000)
    .groupBy(farms.userId, farms.farmerName);
  
  if (existingUsers.length === 0) {
    console.error('❌ No existing users found. Please run generate-demo-data.ts first.');
    process.exit(1);
  }

  console.log(`   Found ${existingUsers.length} existing users to assign farms to\n`);

  const farmsData: Array<{
    userId: number;
    name: string;
    farmerName: string;
    barangay: string;
    municipality: string;
    latitude: string;
    longitude: string;
    size: string;
    crops: string;
    soilType: string | null;
    irrigationType: typeof IRRIGATION_TYPES[number] | null;
    averageYield: string | null;
    status: typeof STATUSES[number];
    registrationDate: string;
  }> = [];

  // Generate farms
  for (let i = 0; i < numFarms; i++) {
    const user = pickRandom(existingUsers);
    const coords = generateCoordinates();
    const barangay = pickRandom(BARANGAYS);
    const numCrops = randomInt(1, 3);
    const crops = Array.from({ length: numCrops }, () => pickRandom(CROP_TYPES));
    const uniqueCrops = Array.from(new Set(crops));
    
    const farmIndex = Math.floor(i / existingUsers.length);
    const farmName = generateFarmName(user.farmerName || 'Farmer', farmIndex);
    
    farmsData.push({
      userId: user.id,
      name: farmName,
      farmerName: user.farmerName || 'Unknown Farmer',
      barangay,
      municipality: 'Calauan',
      latitude: coords.lat,
      longitude: coords.lng,
      size: randomFloat(0.5, 10.0),
      crops: JSON.stringify(uniqueCrops),
      soilType: pickRandom(SOIL_TYPES),
      irrigationType: pickRandom(IRRIGATION_TYPES),
      averageYield: randomFloat(3.0, 8.0),
      status: pickRandom(STATUSES),
      registrationDate: new Date(2020 + randomInt(0, 4), randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0],
    });

    if ((i + 1) % 1000 === 0) {
      console.log(`   Generated ${i + 1}/${numFarms} farms...`);
    }
  }

  console.log(`\n   ✅ Generated ${farmsData.length} farms\n`);

  // Write to CSV
  const csvDir = join(__dirname, '../docs/stress-test');
  const csvPath = join(csvDir, 'stress_farms_map.csv');
  
  const csvHeader = 'id,userId,name,farmerName,barangay,municipality,latitude,longitude,size,crops,soilType,irrigationType,averageYield,status,registrationDate\n';
  const csvRows = farmsData.map((farm, idx) => 
    `${idx + 1},${farm.userId},"${farm.name}","${farm.farmerName}","${farm.barangay}","${farm.municipality}",${farm.latitude},${farm.longitude},${farm.size},"${farm.crops}",${farm.soilType},${farm.irrigationType},${farm.averageYield},${farm.status},${farm.registrationDate}`
  ).join('\n');
  
  writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`   ✅ Wrote CSV to ${csvPath}\n`);

  // Insert into database in batches
  console.log('   Inserting farms into database...\n');
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < farmsData.length; i += batchSize) {
    const batch = farmsData.slice(i, i + batchSize);
    const values = batch.map(farm => ({
      userId: farm.userId,
      name: farm.name,
      farmerName: farm.farmerName,
      barangay: farm.barangay,
      municipality: farm.municipality,
      latitude: farm.latitude,
      longitude: farm.longitude,
      size: farm.size,
      crops: farm.crops,
      soilType: farm.soilType,
      irrigationType: farm.irrigationType,
      averageYield: farm.averageYield,
      status: farm.status,
      registrationDate: farm.registrationDate,
    }));

    await db.insert(farms).values(values);
    inserted += values.length;

    if (inserted % 5000 === 0 || inserted === farmsData.length) {
      console.log(`   ✅ Inserted ${inserted}/${farmsData.length} farms...`);
    }
  }

  console.log(`\n   ✅ Successfully inserted ${inserted} farms into database\n`);
  console.log(`📊 Summary:`);
  console.log(`   Total farms: ${inserted}`);
  console.log(`   CSV file: ${csvPath}`);
  console.log(`\n✅ Stress test data generation complete!\n`);

  await pool.end();
}

// Main execution
const NUM_FARMS = process.argv[2] ? parseInt(process.argv[2], 10) : 20000;

if (isNaN(NUM_FARMS) || NUM_FARMS <= 0) {
  console.error('❌ Invalid number of farms. Usage: tsx scripts/generate-stress-test-farms.ts [numFarms]');
  process.exit(1);
}

generateStressTestFarms(NUM_FARMS).catch(console.error);

