const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

(async () => {
  try {
    const res = await pool.query(
      "SELECT id, owner_id, store_name, status, is_active FROM stores WHERE id = 13"
    );
    console.log('Store data:', JSON.stringify(res.rows, null, 2));
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
})();
