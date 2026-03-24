const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

(async () => {
  try {
    console.log('� CHECKING STORE INFO...\n');
    
    // Get store info
    const stores = await pool.query('SELECT id, name, store_type, slug FROM stores ORDER BY id DESC LIMIT 10');
    console.log('📋 STORES:');
    stores.rows.forEach(s => {
      console.log(`  ID: ${s.id}, Name: "${s.name}", Type: "${s.store_type}", Slug: "${s.slug}"`);
    });
    
    // Get customer info for store 4
    console.log('\n📋 CUSTOMERS IN STORE 4:');
    const customers = await pool.query('SELECT id, store_id, name, phone FROM customers WHERE store_id = 4');
    customers.rows.forEach(c => {
      console.log(`  ID: ${c.id}, Name: "${c.name}", Phone: "${c.phone}"`);
    });
    
    // Test the exact search that the API would do
    console.log('\n🧪 TESTING API SEARCH:');
    const testName = 'مصطفى';
    const testPhone = '07810909577';
    console.log(`  Search: Name="${testName}", Phone="${testPhone}"`);
    
    const result = await pool.query(
      'SELECT id, name, phone FROM customers WHERE store_id = $1 ORDER BY created_at DESC',
      [4]
    );
    
    console.log(`\n  API will return ${result.rows.length} customers`);
    result.rows.forEach(c => {
      console.log(`    - "${c.name}" / "${c.phone}"`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
