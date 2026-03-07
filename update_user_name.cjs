const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

(async () => {
  try {
    const res = await pool.query(
      "UPDATE users SET name = $1 WHERE id = 5 RETURNING id, name, phone, role, store_id",
      ['علي الهادي']
    );
    console.log('Updated user:', JSON.stringify(res.rows, null, 2));
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
})();
