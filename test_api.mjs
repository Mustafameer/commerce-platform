import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:lUvxArS7tPYwMhNVOWOL@web-production-9efff.up.railway.app:5432/railway'
});

(async () => {
  try {
    const stores = await pool.query('SELECT id, slug, store_name FROM stores WHERE id = 13');
    console.log('Store:', stores.rows[0]);
   
    const companies = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = 13 LIMIT 3');
    console.log('Companies count:', companies.rows.length);
    console.log('First companies:', companies.rows);
    
    const categories = await pool.query('SELECT id, name FROM topup_product_categories WHERE store_id = 13 LIMIT 3');
    console.log('Categories count:', categories.rows.length);
    console.log('First categories:', categories.rows);
    
    const products = await pool.query('SELECT id, company_id, amount FROM topup_products WHERE store_id = 13 LIMIT 3');
    console.log('Products count:', products.rows.length);
    console.log('First products:', products.rows);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
