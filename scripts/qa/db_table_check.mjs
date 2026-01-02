import mysql from 'mysql2/promise';
import fs from 'fs';
const url = process.env.DATABASE_URL;
if(!url){ console.error('NO_DATABASE_URL'); process.exit(2); }
const u = new URL(url);
const conn = await mysql.createConnection({
  host: u.hostname,
  user: u.username,
  password: u.password,
  port: u.port || 3306,
  database: u.pathname.slice(1),
  multipleStatements: true
});
try {
  const [r1] = await conn.query("SHOW TABLES LIKE 'batch_order_items'");
  const [r2] = await conn.query("SHOW TABLES LIKE 'delivery_requests'");
  const [r3] = await conn.query("SHOW TABLES LIKE 'delivery_request_events'");
  const out = { batch_order_items: r1.length>0, delivery_requests: r2.length>0, delivery_request_events: r3.length>0, raw:{r1,r2,r3} };
  console.log(JSON.stringify(out));
  fs.writeFileSync('/tmp/db_table_check_output.txt', JSON.stringify(out,null,2));
  await conn.end();
  process.exit(0);
} catch(e){
  console.error('DB_CHECK_ERROR', e.message || e);
  fs.writeFileSync('/tmp/db_table_check_error.txt', String(e));
  await conn.end();
  process.exit(1);
}

