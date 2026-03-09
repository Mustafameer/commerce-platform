import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:lUvxArS7tPYwMhNVOWOL@web-production-9efff.up.railway.app:5432/railway'
});

async function checkData() {
  try {
    const storeId = 13;
    
    // Check if categories exist
    const catRes = await pool.query('SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = $1', [storeId]);
    console.log(`Categories for store ${storeId}: ${catRes.rows[0].count}`);
    
    // Check if companies exist
    const compRes = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1', [storeId]);
    console.log(`Companies for store ${storeId}: ${compRes.rows[0].count}`);
    
    // Check if products exist
    const prodRes = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1', [storeId]);
    console.log(`Products for store ${storeId}: ${prodRes.rows[0].count}`);
    
    // Get sample data
    const cats = await pool.query('SELECT id, name FROM topup_product_categories WHERE store_id = $1 LIMIT 3', [storeId]);
    if (cats.rows.length > 0) {
      console.log('Sample categories:', cats.rows);
    }
    
    const comps = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = $1 LIMIT 3', [storeId]);
    if (comps.rows.length > 0) {
      console.log('Sample companies:', comps.rows);
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkData();
