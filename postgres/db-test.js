// db-test.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:database2025@!@localhost:5432/diveindia_dev';
const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    const now = await client.query('SELECT now() as now');
    console.log('Server time:', now.rows[0].now);
    const res = await client.query("SELECT id, diver_first, diver_last, diver_email FROM submissions LIMIT 5");
    console.table(res.rows);
  } catch (err) {
    console.error('DB error:', err);
  } finally {
    client.release();
    await pool.end();
  }
})();