const mysql = require('mysql2/promise');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('NO_DATABASE_URL');
      process.exit(2);
    }
    
    const deliveryId = process.argv[2];
    if (!deliveryId) {
      console.error('NO_DELIVERY_ID');
      process.exit(2);
    }
    
    const conn = await mysql.createConnection(url);
    
    const [events] = await conn.query(
      'SELECT * FROM delivery_request_events WHERE deliveryRequestId = ? ORDER BY createdAt ASC',
      [deliveryId]
    );
    
    console.log(JSON.stringify({
      deliveryRequestId: deliveryId,
      eventCount: events.length,
      events: events.map(e => ({
        id: e.id,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        actorUserId: e.actorUserId,
        createdAt: e.createdAt
      }))
    }));
    
    await conn.end();
  } catch (e) {
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
})();

