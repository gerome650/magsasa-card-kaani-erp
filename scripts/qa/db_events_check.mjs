import mysql from 'mysql2/promise';

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
  const [events] = await conn.query(
    'SELECT * FROM delivery_request_events WHERE deliveryRequestId = ? ORDER BY createdAt ASC',
    [deliveryId]
  );

  const result = {
    deliveryRequestId: deliveryId,
    eventCount: events.length,
    events: events.map(e => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      actorUserId: e.actorUserId,
      createdAt: e.createdAt
    }))
  };

  console.log(JSON.stringify(result, null, 2));
  await conn.end();
  process.exit(0);
} catch (e) {
  console.error(JSON.stringify({ error: e.message }));
  await conn.end();
  process.exit(1);
}

