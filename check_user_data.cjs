const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

(async () => {
  try {
    const res = await pool.query(
      "SELECT id, name, phone, role, store_id FROM users WHERE phone = '07810909577'"
    );
    console.log('User data:', JSON.stringify(res.rows, null, 2));
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
})();
