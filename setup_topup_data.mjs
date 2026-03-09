import pg from 'pg';
import fetch from 'node-fetch';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:lUvxArS7tPYwMhNVOWOL@web-production-9efff.up.railway.app:5432/railway'
});

(async () => {
  try {
    const storeId = 13;
    
    // Check if categories exist
    const catRes = await pool.query('SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = $1', [storeId]);
    console.log(`Categories for store ${storeId}: ${catRes.rows[0].count}`);
    
    if (catRes.rows[0].count === 0) {
      console.log('Adding default categories...');
      await pool.query(`
        INSERT INTO topup_product_categories (store_id, name, is_active) VALUES
        ($1, 'عام', true),
        ($1, 'شحن مسبق', true),
        ($1, 'تحويل رصيد', true)
      `, [storeId]);
      console.log('Categories added');
    }
    
    // Check if companies exist
    const compRes = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1', [storeId]);
    console.log(`Companies for store ${storeId}: ${compRes.rows[0].count}`);
    
    // Check if products exist
    const prodRes = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1', [storeId]);
    console.log(`Products for store ${storeId}: ${prodRes.rows[0].count}`);
    
    if (prodRes.rows[0].count === 0 && compRes.rows[0].count > 0) {
      console.log('Adding sample products...');
      const companiesRes = await pool.query('SELECT id FROM topup_companies WHERE store_id = $1 LIMIT 1', [storeId]);
      if (companiesRes.rows.length > 0) {
        const companyId = companiesRes.rows[0].id;
        await pool.query(`
          INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, is_active) VALUES
          ($1, $2, 1, 5000, 5500, 5400, 5300, true),
          ($1, $2, 1, 10000, 11000, 10800, 10600, true),
          ($1, $2, 1, 25000, 27500, 27000, 26500, true)
        `, [storeId, companyId]);
        console.log('Products added');
      }
    }
    
    // Test API endpoints
    console.log('\n🔍 Testing API endpoints:');
    const baseUrl = 'https://web-production-9efff.up.railway.app';
    
    const cats = await fetch(`${baseUrl}/api/topup/categories/${storeId}`).then(r => r.json());
    console.log(`Categories API: ${Array.isArray(cats) ? cats.length : 'error'} items`);
    
    const comps = await fetch(`${baseUrl}/api/topup/companies/${storeId}`).then(r => r.json());
    console.log(`Companies API: ${Array.isArray(comps) ? comps.length : (comps.value ? comps.value.length : 'error')} items`);
    
    const prods = await fetch(`${baseUrl}/api/topup/products/${storeId}`).then(r => r.json());
    console.log(`Products API: ${Array.isArray(prods) ? prods.length : 'error'} items`);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
