import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });
async function check() {
  const r = await pool.query("SELECT * FROM users LIMIT 1");
  console.log('FINAL COLUMNS:', r.fields.map(f => f.name));
  console.log('FINAL DATA:', r.rows);
  await pool.end();
}
check();
