const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function check() {
  try {
    const users = await pool.query("SELECT id, name, email FROM users WHERE email = 'mustafameer2000@gmail.com'");
    console.log('Users found:', users.rows);
    
    if (users.rows.length > 0) {
      const stores = await pool.query("SELECT * FROM stores WHERE owner_id = $1", [users.rows[0].id]);
      console.log('Stores found for this user:', stores.rows);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
