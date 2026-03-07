const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // Check categories
    const catRes = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    console.log('=== CATEGORIES ===');
    catRes.rows.forEach(c => console.log('ID:', c.id, 'Name:', c.name));
    
    // Count products per category
    const prodRes = await pool.query(
      `SELECT category_id, COUNT(*) as count FROM topup_products 
       WHERE store_id = 13 GROUP BY category_id ORDER BY category_id`
    );
    console.log('\n=== PRODUCTS PER CATEGORY ===');
    prodRes.rows.forEach(p => console.log('Category:', p.category_id, 'Count:', p.count));
    
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
