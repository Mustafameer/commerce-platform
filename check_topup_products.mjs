import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkTopupProducts() {
  try {
    const res = await pool.query('SELECT * FROM topup_products LIMIT 1');
    console.log(`Column names:`, Object.keys(res.rows[0] || {}));
    
    const allRes = await pool.query('SELECT id FROM topup_products');
    console.log(`\nTotal Topup Products: ${allRes.rows.length}`);
    
    pool.end();
  } catch(e) {
    console.error(e.message);
    pool.end();
  }
}

checkTopupProducts();
