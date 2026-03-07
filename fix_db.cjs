const pg = require('pg');
console.log('Script started');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function fix() {
  try {
    await pool.query("DELETE FROM users WHERE email = 'admin@ecommerce.com'");
    const res = await pool.query("SELECT * FROM users WHERE email = 'admin@platform.com'");
    if (res.rows.length === 0) {
      await pool.query("INSERT INTO users (email, password, role, name) VALUES ('admin@platform.com', 'admin123', 'admin', 'Super Admin')");
      console.log('Created admin@platform.com');
    } else {
      await pool.query("UPDATE users SET password = 'admin123' WHERE email = 'admin@platform.com'");
      console.log('Updated admin@platform.com password');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

fix();
