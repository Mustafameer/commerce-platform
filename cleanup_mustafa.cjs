const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function cleanup() {
  try {
    const email = 'mustafameer2000@gmail.com';
    await pool.query("DELETE FROM stores WHERE owner_id IN (SELECT id FROM users WHERE email = $1)", [email]);
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
    console.log('Successfully cleaned up attempt for: ' + email);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

cleanup();
