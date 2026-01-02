const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('NO_DATABASE_URL');
      process.exit(2);
    }
    
    const migrationFile = path.join(process.cwd(), 'drizzle/0010_delivery_requests.sql');
    if (!fs.existsSync(migrationFile)) {
      console.error('MIGRATION_FILE_NOT_FOUND');
      process.exit(2);
    }
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by statement-breakpoint but keep statements intact
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => {
        // Remove comments and clean up
        return s.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0);
    
    const conn = await mysql.createConnection(url);
    
    console.log('Executing migration statements...');
    const results = [];
    
    for (const stmt of statements) {
      if (!stmt || stmt.trim().length === 0) continue;
      try {
        await conn.query(stmt);
        results.push({ statement: stmt.substring(0, 100) + '...', success: true });
      } catch (e) {
        // If table exists error, that's okay - continue
        if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.message.includes('already exists')) {
          results.push({ statement: stmt.substring(0, 100) + '...', success: true, note: 'already exists' });
        } else {
          results.push({ statement: stmt.substring(0, 100) + '...', success: false, error: e.message });
          throw e;
        }
      }
    }
    
    console.log(JSON.stringify({ success: true, results }));
    
    await conn.end();
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e.message, code: e.code }));
    process.exit(1);
  }
})();

