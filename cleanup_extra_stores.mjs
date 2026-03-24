import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('❌ [FATAL] DATABASE_URL not set - cloud-only configuration required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAndCleanStores() {
  try {
    console.log('🔍 Checking all stores in database:\n');

    const result = await pool.query(
      `SELECT id, slug, store_type, is_active, status FROM stores ORDER BY id`
    );
    
    console.log(`📊 Total stores: ${result.rows.length}\n`);
    result.rows.forEach(s => {
      console.log(`ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type || 'regular'} | Active: ${s.is_active} | Status: ${s.status}`);
    });

    // Keep only:
    // 1. One topup store (Store 13)
    // 2. One regular store (Store 1)
    
    console.log('\n🗑️ Stores to delete:');
    const toDelete = result.rows.filter(s => !(
      (s.id === 13 && s.store_type === 'topup') ||
      (s.id === 1 && s.store_type !== 'topup')
    ));

    if (toDelete.length === 0) {
      console.log('   ✅ No stores need to be deleted');
    } else {
      toDelete.forEach(s => {
        console.log(`   - ID: ${s.id} (${s.slug})`);
      });

      console.log('\n🔄 Starting deletion...');
      
      // Delete related data first (foreign keys)
      for (const store of toDelete) {
        try {
          // Delete orders first (depends on customers)
          await pool.query('DELETE FROM orders WHERE store_id = $1', [store.id]);
          console.log(`✅ Deleted orders for store ${store.id}`);
          
          // Delete customers
          await pool.query('DELETE FROM customers WHERE store_id = $1', [store.id]);
          console.log(`✅ Deleted customers for store ${store.id}`);
          
          // Delete products
          await pool.query('DELETE FROM products WHERE store_id = $1', [store.id]);
          console.log(`✅ Deleted products for store ${store.id}`);
          
          // Delete topup data
          await pool.query('DELETE FROM topup_products WHERE store_id = $1', [store.id]);
          await pool.query('DELETE FROM topup_companies WHERE store_id = $1', [store.id]);
          await pool.query('DELETE FROM topup_product_categories WHERE store_id = $1', [store.id]);
          console.log(`✅ Deleted topup data for store ${store.id}`);
          
          // Finally delete the store
          await pool.query('DELETE FROM stores WHERE id = $1', [store.id]);
          console.log(`✅ Deleted store ${store.id}`);
        } catch (err) {
          console.error(`❌ Error deleting store ${store.id}:`, err.message);
        }
      }
      
      console.log('\n✅ Cleanup complete!');
    }

    // Show final state
    console.log('\n✅ Final stores in database:\n');
    const finalResult = await pool.query(
      `SELECT id, slug, store_type, is_active FROM stores ORDER BY id`
    );
    finalResult.rows.forEach(s => {
      console.log(`ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type || 'regular'}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndCleanStores();
