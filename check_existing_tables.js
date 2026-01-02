const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('NO_DATABASE_URL');
      process.exit(2);
    }
    
    const conn = await mysql.createConnection(url);
    
    const [tables1] = await conn.query("SHOW TABLES LIKE 'batch_order_items'");
    const [tables2] = await conn.query("SHOW TABLES LIKE 'delivery_requests'");
    const [tables3] = await conn.query("SHOW TABLES LIKE 'delivery_request_events'");
    
    const result = {
      batch_order_items: tables1.length > 0,
      delivery_requests: tables2.length > 0,
      delivery_request_events: tables3.length > 0,
      raw: {
        batch_order_items: tables1,
        delivery_requests: tables2,
        delivery_request_events: tables3
      }
    };
    
    console.log(JSON.stringify(result, null, 2));
    
    await conn.end();
  } catch (e) {
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
})();

