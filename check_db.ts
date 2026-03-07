import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });
async function check() {
  const r = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email'");
  console.log('RESULT:', JSON.stringify(r.rows, null, 2));
  await pool.end();
}
check().catch(console.error);
