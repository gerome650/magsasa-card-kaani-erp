import { drizzle } from 'drizzle-orm/mysql2';
import { farms } from '../drizzle/schema.js';

// Get database connection
const db = drizzle(process.env.DATABASE_URL);

// Sample farm data matching the frontend expectations
const sampleFarms = [
  {
    userId: 1, // Assuming owner user ID is 1
    name: 'Santos Rice Farm',
    farmerName: 'Maria Santos',
    barangay: 'San Isidro',
    municipality: 'Calauan',
    latitude: '14.147500',
    longitude: '121.318900',
    size: '2.5',
    crops: JSON.stringify(['Palay (Rice)']),
    soilType: 'Clay Loam',
    irrigationType: 'Irrigated',
    averageYield: '5.8',
    status: 'active',
  },
  {
    userId: 1,
    name: 'Cruz Vegetable Farm',
    farmerName: 'Juan Cruz',
    barangay: 'Dayap',
    municipality: 'Calauan',
    latitude: '14.152300',
    longitude: '121.324500',
    size: '1.2',
    crops: JSON.stringify(['Tomato', 'Eggplant', 'Okra']),
    soilType: 'Sandy Loam',
    irrigationType: 'Irrigated',
    averageYield: '12.5',
    status: 'active',
  },
  {
    userId: 1,
    name: 'Reyes Corn Field',
    farmerName: 'Pedro Reyes',
    barangay: 'Lamot 1',
    municipality: 'Calauan',
    latitude: '14.145800',
    longitude: '121.312300',
    size: '3.8',
    crops: JSON.stringify(['Corn']),
    soilType: 'Loam',
    irrigationType: 'Rainfed',
    averageYield: '4.2',
    status: 'active',
  },
  {
    userId: 1,
    name: 'Garcia Mixed Farm',
    farmerName: 'Rosa Garcia',
    barangay: 'Balayhangin',
    municipality: 'Calauan',
    latitude: '14.141200',
    longitude: '121.327800',
    size: '2.0',
    crops: JSON.stringify(['Palay (Rice)', 'Vegetables']),
    soilType: 'Clay',
    irrigationType: 'Irrigated',
    averageYield: '6.5',
    status: 'active',
  },
  {
    userId: 1,
    name: 'Mendoza Upland Farm',
    farmerName: 'Carlos Mendoza',
    barangay: 'Kanluran Talaongan',
    municipality: 'Cavinti',
    latitude: '14.245600',
    longitude: '121.512300',
    size: '1.5',
    crops: JSON.stringify(['Banana', 'Cassava']),
    soilType: 'Sandy',
    irrigationType: 'Upland',
    averageYield: '8.0',
    status: 'active',
  },
];

async function seed() {
  try {
    console.log('🌱 Seeding database with sample farms...');
    
    for (const farm of sampleFarms) {
      await db.insert(farms).values(farm);
      console.log(`✅ Created farm: ${farm.name}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
