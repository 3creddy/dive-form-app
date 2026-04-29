const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('🗄️  Connected to Postgres');
});

module.exports = pool;