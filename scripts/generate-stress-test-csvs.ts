import { writeFileSync } from 'fs';
import { join } from 'path';

// Generate large CSVs for stress testing Admin CSV Upload

const OUTPUT_DIR = join(process.cwd(), 'docs', 'stress-test');

// Ensure output directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
} catch (e) {
  // Directory might already exist
}

// Configuration
const FARMERS_COUNT = 10000;
const FARMS_PER_FARMER = 2; // Average
const SEASONS_PER_FARM = 3; // Average

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

const BARANGAYS = [
  'San Isidro', 'Dayap', 'Lamot 1', 'Lamot 2', 'Balayhangin',
  'Kanluran Talaongan', 'Silangan Talaongan', 'Bubukal', 'Bungkol',
  'Calumpang', 'Dila', 'Masili', 'Palina', 'Poblacion 1', 'Poblacion 2',
  'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Santo Tomas', 'Talolong'
];

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Pedro', 'Rosa', 'Carlos', 'Ana', 'Luis',
  'Carmen', 'Miguel', 'Isabel', 'Ricardo', 'Patricia', 'Fernando',
  'Roberto', 'Elena', 'Antonio', 'Manuel', 'Dolores', 'Francisco',
  'Teresa', 'Ramon', 'Concepcion', 'Alfredo', 'Gloria', 'Vicente', 'Mercedes'
];

const LAST_NAMES = [
  'Santos', 'Cruz', 'Reyes', 'Garcia', 'Ramos', 'Torres', 'Lopez', 'Fernandez',
  'Gonzalez', 'Rivera', 'Diaz', 'Morales', 'Ortiz', 'Sanchez', 'Ramirez',
  'Flores', 'Gutierrez', 'Herrera', 'Jimenez', 'Villanueva', 'Martinez',
  'Castro', 'Mendoza', 'Villanueva', 'Ramos', 'Torres', 'Garcia', 'Cruz'
];

const CROP_TYPES = [
  'Palay (Rice)', 'Corn', 'Tomato', 'Eggplant', 'Okra', 'Pepper',
  'Cucumber', 'Squash', 'Banana', 'Cassava', 'Sweet Potato', 'Mango', 'Papaya'
];

const SOIL_TYPES = ['Clay Loam', 'Sandy Loam', 'Loam', 'Clay', 'Sandy'];
const IRRIGATION_TYPES = ['Irrigated', 'Rainfed', 'Upland'];
const QUALITY_GRADES = ['Premium', 'Standard', 'Below Standard'];
const UNITS = ['kg', 'tons'];

// Generate Farmers CSV
console.log(`Generating ${FARMERS_COUNT} farmers...`);
const farmers: string[] = ['openId,name,email,barangay'];
for (let i = 1; i <= FARMERS_COUNT; i++) {
  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const openId = `stress-farmer-${i}`;
  const email = `${openId}@calauan.local`;
  const barangay = pickRandom(BARANGAYS);
  farmers.push(`${openId},"${name}",${email},"${barangay}"`);
}
writeFileSync(join(OUTPUT_DIR, 'stress_farmers.csv'), farmers.join('\n'));
console.log(`✅ Created stress_farmers.csv with ${FARMERS_COUNT} rows`);

// Generate Farms CSV
console.log(`Generating farms (${FARMS_PER_FARMER} per farmer on average)...`);
const farms: string[] = ['farmerOpenId,name,farmerName,barangay,municipality,latitude,longitude,size,crops,soilType,irrigationType,averageYield,status,registrationDate'];
let farmId = 1;
const farmMap = new Map<string, number>(); // farmerOpenId -> farmId

for (let i = 1; i <= FARMERS_COUNT; i++) {
  const farmerOpenId = `stress-farmer-${i}`;
  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const farmerName = `${firstName} ${lastName}`;
  const barangay = pickRandom(BARANGAYS);
  const numFarms = randomInt(1, 3); // 1-3 farms per farmer
  
  for (let j = 0; j < numFarms; j++) {
    const farmName = `${farmerName}'s Farm ${j + 1}`;
    const latitude = (14.14 + randomFloat(-0.01, 0.01)).toFixed(6);
    const longitude = (121.31 + randomFloat(-0.01, 0.01)).toFixed(6);
    const size = randomFloat(0.5, 5.0).toFixed(2);
    const crops = JSON.stringify([pickRandom(CROP_TYPES)]);
    const soilType = pickRandom(SOIL_TYPES);
    const irrigationType = pickRandom(IRRIGATION_TYPES);
    const averageYield = randomFloat(3.0, 15.0).toFixed(2);
    const status = 'active';
    const registrationDate = `202${randomInt(0, 4)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`;
    
    farms.push(`${farmerOpenId},"${farmName}","${farmerName}","${barangay}",Calauan,${latitude},${longitude},${size},"${crops}",${soilType},${irrigationType},${averageYield},${status},${registrationDate}`);
    farmMap.set(`${farmName}|${farmerName}`, farmId++);
  }
}
writeFileSync(join(OUTPUT_DIR, 'stress_farms.csv'), farms.join('\n'));
console.log(`✅ Created stress_farms.csv with ${farms.length - 1} rows`);

// Generate Seasons CSV
console.log(`Generating seasons (${SEASONS_PER_FARM} per farm on average)...`);
const seasons: string[] = ['farmName,farmerName,parcelIndex,cropType,harvestDate,quantity,unit,qualityGrade'];
let seasonCount = 0;

// Read farms to generate seasons
for (let i = 1; i < farms.length; i++) {
  const farmRow = farms[i].split(',');
  const farmName = farmRow[1].replace(/"/g, '');
  const farmerName = farmRow[2].replace(/"/g, '');
  const numSeasons = randomInt(2, 4); // 2-4 seasons per farm
  
  for (let j = 0; j < numSeasons; j++) {
    const parcelIndex = 0;
    const cropType = pickRandom(CROP_TYPES);
    const year = randomInt(2022, 2024);
    const month = String(randomInt(1, 12)).padStart(2, '0');
    const day = String(randomInt(1, 28)).padStart(2, '0');
    const harvestDate = `${year}-${month}-${day}`;
    const quantity = randomFloat(10.0, 100.0).toFixed(2);
    const unit = pickRandom(UNITS);
    const qualityGrade = pickRandom(QUALITY_GRADES);
    
    seasons.push(`"${farmName}","${farmerName}",${parcelIndex},"${cropType}",${harvestDate},${quantity},${unit},${qualityGrade}`);
    seasonCount++;
  }
}
writeFileSync(join(OUTPUT_DIR, 'stress_seasons.csv'), seasons.join('\n'));
console.log(`✅ Created stress_seasons.csv with ${seasonCount} rows`);

console.log('\n📊 Summary:');
console.log(`  Farmers: ${FARMERS_COUNT} rows`);
console.log(`  Farms: ${farms.length - 1} rows`);
console.log(`  Seasons: ${seasonCount} rows`);
console.log(`\n✅ All stress test CSVs created in: ${OUTPUT_DIR}`);

