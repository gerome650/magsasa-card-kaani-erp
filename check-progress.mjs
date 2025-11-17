import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL);

async function check() {
  const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
  const [farms] = await pool.query('SELECT COUNT(*) as count FROM farms');
  const [yields] = await pool.query('SELECT COUNT(*) as count FROM yields');
  const [costs] = await pool.query('SELECT COUNT(*) as count FROM costs');
  
  console.log('Progress:');
  console.log(`  Farmers: ${users[0].count}/238`);
  console.log(`  Farms: ${farms[0].count}/238`);
  console.log(`  Yields: ${yields[0].count}/908`);
  console.log(`  Costs: ${costs[0].count}/1313`);
  
  await pool.end();
}

check();
