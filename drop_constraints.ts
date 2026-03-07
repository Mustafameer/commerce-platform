import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function work() {
  try {
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key');
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');
    console.log('Constraints dropped successfully');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
work();
