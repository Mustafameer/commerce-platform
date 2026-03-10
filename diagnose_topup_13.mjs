import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:lUvxArS7tPYwMhNVOWOL@web-production-9efff.up.railway.app:5432/railway'
});

async function checkStoreData() {
  try {
    console.log('=== Checking Store 13 Data ===\n');
    
    const storeId = 13;
    
    // Check store exists
    const store = await pool.query('SELECT id, store_name, store_type FROM stores WHERE id = $1', [storeId]);
    console.log('Store:', store.rows[0] || 'NOT FOUND');
    
    if (store.rows.length === 0) {
      console.log('ERROR: Store 13 not found!');
      await pool.end();
      return;
    }
    
    // Check if it's topup type
    const storeType = store.rows[0].store_type;
    console.log(`Store Type: ${storeType}\n`);
    
    if (storeType !== 'topup') {
      console.log('ERROR: Store 13 is not a topup store!');
      await pool.end();
      return;
    }
    
    // Check categories
    const cats = await pool.query('SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = $1', [storeId]);
    console.log(`Categories: ${cats.rows[0].count}`);
    
    // Check companies
    const comps = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1', [storeId]);
    console.log(`Companies: ${comps.rows[0].count}`);
    
    // Check products
    const prods = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1', [storeId]);
    console.log(`Products: ${prods.rows[0].count}\n`);
    
    // Show sample data
    if (comps.rows[0].count > 0) {
      const sampleComps = await pool.query('SELECT id, name FROM topup_companies WHERE store_id = $1 LIMIT 3', [storeId]);
      console.log('Sample Companies:');
      sampleComps.rows.forEach(c => console.log(`  - ${c.name}`));
    }
    
    if (cats.rows[0].count > 0) {
      const sampleCats = await pool.query('SELECT id, name FROM topup_product_categories WHERE store_id = $1 LIMIT 3', [storeId]);
      console.log('\nSample Categories:');
      sampleCats.rows.forEach(c => console.log(`  - ${c.name}`));
    }
    
    if (prods.rows[0].count > 0) {
      const sampleProds = await pool.query('SELECT id, amount, price FROM topup_products WHERE store_id = $1 LIMIT 3', [storeId]);
      console.log('\nSample Products:');
      sampleProds.rows.forEach(p => console.log(`  - Amount: ${p.amount}, Price: ${p.price}`));
    } else {
      console.log('\n⚠️ NO PRODUCTS FOUND - This is the problem!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    await pool.end();
  }
}

checkStoreData();
