import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function checkStores() {
  try {
    console.log('📊 Checking stores with data...\n');
    
    // List all stores
    const stores = await pool.query('SELECT id, store_name, name, slug, store_type FROM stores ORDER BY id');
    console.log('🏪 All Stores:');
    stores.rows.forEach(s => {
      console.log(`  Store ${s.id}: "${s.store_name || s.name}" (slug: "${s.slug}") type: ${s.store_type}`);
    });
    
    console.log('\n');
    
    // Check data for each store
    for (const store of [1, 2, 3, 13, 21]) {
      const companies = await pool.query('SELECT COUNT(*) as count FROM companies WHERE store_id = $1', [store]);
      const products = await pool.query('SELECT COUNT(*) as count FROM products WHERE store_id = $1', [store]);
      const customers = await pool.query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1', [store]);
      
      console.log(`Store ${store}:`);
      console.log(`  Companies: ${companies.rows[0].count}`);
      console.log(`  Products: ${products.rows[0].count}`);
      console.log(`  Customers: ${customers.rows[0].count}`);
    }
    
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

checkStores();
