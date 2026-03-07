import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

console.log('🔄 Testing connection to: postgresql://postgres:123@localhost:5432/multi_ecommerce');

try {
  const result = await pool.query('SELECT NOW()');
  console.log('✅ Connected successfully!');
  console.log('Current time from DB:', result.rows[0]);
  await pool.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
