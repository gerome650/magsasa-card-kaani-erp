// This file has been migrated to TypeScript: scripts/seed-farms.ts
// Use: pnpm seed:farms
// This .mjs file is kept for reference only.

// Get database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = mysql.createPool(connectionString);
const db = drizzle(pool);

// Expanded sample farm data for demo (25 farms)
const sampleFarms = [
  { name: 'Santos Rice Farm', farmerName: 'Maria Santos', barangay: 'San Isidro', municipality: 'Calauan', latitude: '14.147500', longitude: '121.318900', size: '2.5', crops: ['Palay (Rice)'], soilType: 'Clay Loam', irrigationType: 'Irrigated', averageYield: '5.8', status: 'active' },
  { name: 'Cruz Vegetable Farm', farmerName: 'Juan dela Cruz', barangay: 'Dayap', municipality: 'Calauan', latitude: '14.152300', longitude: '121.324500', size: '1.2', crops: ['Tomato', 'Eggplant', 'Okra'], soilType: 'Sandy Loam', irrigationType: 'Irrigated', averageYield: '12.5', status: 'active' },
  { name: 'Reyes Corn Field', farmerName: 'Pedro Reyes', barangay: 'Lamot 1', municipality: 'Calauan', latitude: '14.145800', longitude: '121.312300', size: '3.8', crops: ['Corn'], soilType: 'Loam', irrigationType: 'Rainfed', averageYield: '4.2', status: 'active' },
  { name: 'Garcia Mixed Farm', farmerName: 'Rosa Garcia', barangay: 'Balayhangin', municipality: 'Calauan', latitude: '14.141200', longitude: '121.327800', size: '2.0', crops: ['Palay (Rice)', 'Vegetables'], soilType: 'Clay', irrigationType: 'Irrigated', averageYield: '6.5', status: 'active' },
  { name: 'Mendoza Upland Farm', farmerName: 'Carlos Mendoza', barangay: 'Kanluran Talaongan', municipality: 'Cavinti', latitude: '14.245600', longitude: '121.512300', size: '1.5', crops: ['Banana', 'Cassava'], soilType: 'Sandy', irrigationType: 'Upland', averageYield: '8.0', status: 'active' },
  { name: 'Villanueva Rice Paddy', farmerName: 'Roberto Villanueva', barangay: 'San Isidro', municipality: 'Calauan', latitude: '14.148200', longitude: '121.320100', size: '3.2', crops: ['Palay (Rice)'], soilType: 'Clay Loam', irrigationType: 'Irrigated', averageYield: '6.2', status: 'active' },
  { name: 'Martinez Corn Field', farmerName: 'Elena Martinez', barangay: 'Dayap', municipality: 'Calauan', latitude: '14.153100', longitude: '121.325200', size: '2.8', crops: ['Corn'], soilType: 'Loam', irrigationType: 'Rainfed', averageYield: '4.5', status: 'active' },
  { name: 'Ramos Vegetable Garden', farmerName: 'Carlos Ramos', barangay: 'Lamot 1', municipality: 'Calauan', latitude: '14.146500', longitude: '121.313100', size: '1.8', crops: ['Tomato', 'Pepper', 'Cucumber'], soilType: 'Sandy Loam', irrigationType: 'Irrigated', averageYield: '11.2', status: 'active' },
  { name: 'Torres Mixed Crops', farmerName: 'Ana Torres', barangay: 'Balayhangin', municipality: 'Calauan', latitude: '14.142100', longitude: '121.328500', size: '2.3', crops: ['Palay (Rice)', 'Corn'], soilType: 'Clay', irrigationType: 'Irrigated', averageYield: '5.8', status: 'active' },
  { name: 'Lopez Fruit Orchard', farmerName: 'Jose Lopez', barangay: 'Kanluran Talaongan', municipality: 'Cavinti', latitude: '14.246200', longitude: '121.513100', size: '4.5', crops: ['Mango', 'Banana'], soilType: 'Sandy', irrigationType: 'Upland', averageYield: '9.5', status: 'active' },
  { name: 'Fernandez Rice Farm', farmerName: 'Luis Fernandez', barangay: 'San Isidro', municipality: 'Calauan', latitude: '14.149000', longitude: '121.321200', size: '2.7', crops: ['Palay (Rice)'], soilType: 'Clay Loam', irrigationType: 'Irrigated', averageYield: '6.0', status: 'active' },
  { name: 'Gonzalez Corn Field', farmerName: 'Carmen Gonzalez', barangay: 'Dayap', municipality: 'Calauan', latitude: '14.154000', longitude: '121.326300', size: '3.5', crops: ['Corn'], soilType: 'Loam', irrigationType: 'Rainfed', averageYield: '4.3', status: 'active' },
  { name: 'Rivera Vegetable Plot', farmerName: 'Miguel Rivera', barangay: 'Lamot 1', municipality: 'Calauan', latitude: '14.147200', longitude: '121.314000', size: '1.5', crops: ['Eggplant', 'Okra', 'Squash'], soilType: 'Sandy Loam', irrigationType: 'Irrigated', averageYield: '10.8', status: 'active' },
  { name: 'Diaz Mixed Farm', farmerName: 'Rosa Diaz', barangay: 'Balayhangin', municipality: 'Calauan', latitude: '14.143000', longitude: '121.329200', size: '2.1', crops: ['Palay (Rice)', 'Vegetables'], soilType: 'Clay', irrigationType: 'Irrigated', averageYield: '6.3', status: 'active' },
  { name: 'Cruz Upland Farm', farmerName: 'Antonio Cruz', barangay: 'Kanluran Talaongan', municipality: 'Cavinti', latitude: '14.247000', longitude: '121.514000', size: '2.0', crops: ['Cassava', 'Sweet Potato'], soilType: 'Sandy', irrigationType: 'Upland', averageYield: '7.5', status: 'active' },
  { name: 'Morales Rice Paddy', farmerName: 'Patricia Morales', barangay: 'San Isidro', municipality: 'Calauan', latitude: '14.149800', longitude: '121.322100', size: '3.0', crops: ['Palay (Rice)'], soilType: 'Clay Loam', irrigationType: 'Irrigated', averageYield: '5.9', status: 'active' },
  { name: 'Ortiz Corn Field', farmerName: 'Fernando Ortiz', barangay: 'Dayap', municipality: 'Calauan', latitude: '14.154800', longitude: '121.327100', size: '2.6', crops: ['Corn'], soilType: 'Loam', irrigationType: 'Rainfed', averageYield: '4.4', status: 'active' },
  { name: 'Sanchez Vegetable Farm', farmerName: 'Isabel Sanchez', barangay: 'Lamot 1', municipality: 'Calauan', latitude: '14.147900', longitude: '121.314800', size: '1.9', crops: ['Tomato', 'Pepper'], soilType: 'Sandy Loam', irrigationType: 'Irrigated', averageYield: '11.5', status: 'active' },
  { name: 'Ramirez Mixed Crops', farmerName: 'Ricardo Ramirez', barangay: 'Balayhangin', municipality: 'Calauan', latitude: '14.143800', longitude: '121.329900', size: '2.4', crops: ['Palay (Rice)', 'Corn'], soilType: 'Clay', irrigationType: 'Irrigated', averageYield: '5.7', status: 'active' },
  { name: 'Flores Fruit Farm', farmerName: 'Maria Flores', barangay: 'Kanluran Talaongan', municipality: 'Cavinti', latitude: '14.247800', longitude: '121.514800', size: '3.8', crops: ['Mango', 'Papaya'], soilType: 'Sandy', irrigationType: 'Upland', averageYield: '8.8', status: 'active' },
  { name: 'Ramos Rice Farm', farmerName: 'Juan Ramos', barangay: 'San Isidro', municipality: 'Calauan', latitude: '14.150600', longitude: '121.323000', size: '2.9', crops: ['Palay (Rice)'], soilType: 'Clay Loam', irrigationType: 'Irrigated', averageYield: '6.1', status: 'active' },
  { name: 'Torres Corn Field', farmerName: 'Pedro Torres', barangay: 'Dayap', municipality: 'Calauan', latitude: '14.155600', longitude: '121.328000', size: '3.3', crops: ['Corn'], soilType: 'Loam', irrigationType: 'Rainfed', averageYield: '4.6', status: 'active' },
  { name: 'Gutierrez Vegetable Garden', farmerName: 'Ana Gutierrez', barangay: 'Lamot 1', municipality: 'Calauan', latitude: '14.148600', longitude: '121.315600', size: '1.7', crops: ['Okra', 'Squash', 'Cucumber'], soilType: 'Sandy Loam', irrigationType: 'Irrigated', averageYield: '10.5', status: 'active' },
  { name: 'Herrera Mixed Farm', farmerName: 'Carlos Herrera', barangay: 'Balayhangin', municipality: 'Calauan', latitude: '14.144600', longitude: '121.330600', size: '2.2', crops: ['Palay (Rice)', 'Vegetables'], soilType: 'Clay', irrigationType: 'Irrigated', averageYield: '6.4', status: 'active' },
  { name: 'Jimenez Upland Farm', farmerName: 'Rosa Jimenez', barangay: 'Kanluran Talaongan', municipality: 'Cavinti', latitude: '14.248600', longitude: '121.515600', size: '1.8', crops: ['Banana', 'Cassava'], soilType: 'Sandy', irrigationType: 'Upland', averageYield: '8.2', status: 'active' },
];

async function seed() {
  try {
    console.log('🌱 Seeding database with demo farms...');
    
    // Find or create demo manager user
    // DEV-ONLY: In development, we use the demo manager's openId to find/create the user
    const demoManagerOpenId = 'demo-manager';
    let demoUser = await db.select().from(users).where(eq(users.openId, demoManagerOpenId)).limit(1);
    
    let userId;
    if (demoUser.length === 0) {
      // Create demo manager user if it doesn't exist
      console.log('👤 Creating demo manager user...');
      const [result] = await db.insert(users).values({
        openId: demoManagerOpenId,
        name: 'Roberto Garcia',
        email: 'roberto.garcia@magsasa.org',
        loginMethod: 'demo',
        role: 'admin',
      });
      userId = result.insertId;
      console.log(`✅ Created demo manager user with ID: ${userId}`);
    } else {
      userId = demoUser[0].id;
      console.log(`✅ Found demo manager user with ID: ${userId}`);
    }
    
    // Check if farms already exist
    const existingFarms = await db.select().from(farms).limit(1);
    if (existingFarms.length > 0) {
      console.log('⚠️  Farms already exist in database. Skipping seed.');
      console.log('💡 To re-seed, delete existing farms first.');
      await pool.end();
      process.exit(0);
    }
    
    // Insert farms with the demo manager's userId
    console.log(`🌾 Inserting ${sampleFarms.length} farms...`);
    for (const farm of sampleFarms) {
      await db.insert(farms).values({
        userId: userId,
        name: farm.name,
        farmerName: farm.farmerName,
        barangay: farm.barangay,
        municipality: farm.municipality,
        latitude: farm.latitude,
        longitude: farm.longitude,
        size: farm.size,
        crops: JSON.stringify(farm.crops),
        soilType: farm.soilType,
        irrigationType: farm.irrigationType,
        averageYield: farm.averageYield,
        status: farm.status,
      });
      console.log(`✅ Created farm: ${farm.name}`);
    }
    
    console.log(`🎉 Successfully seeded ${sampleFarms.length} farms!`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
