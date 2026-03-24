import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('❌ [FATAL] DATABASE_URL not set - cloud-only configuration required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupStores() {
  try {
    console.log('🔍 Checking all stores:\n');

    // Get all stores
    const storesResult = await pool.query(
      `SELECT id, slug, store_type, is_active FROM stores ORDER BY id`
    );
    
    console.log(`📋 Total Stores: ${storesResult.rows.length}\n`);
    storesResult.rows.forEach(s => {
      console.log(`ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type || 'regular'} | Active: ${s.is_active}`);
    });

    // Delete all stores except Store 13 (ali-hadi - topup) and Store ID for bayt-aneeq (if exists)
    console.log('\n🗑️  Deleting unnecessary stores...\n');

    // Find bayt-aneeq
    const baytAneeqResult = await pool.query(
      `SELECT id FROM stores WHERE slug LIKE '%bayt%aneeq%' OR slug LIKE '%aneeq%'`
    );
    
    const baytAneeqId = baytAneeqResult.rows.length > 0 ? baytAneeqResult.rows[0].id : null;
    console.log(`   Bayt Aneeq ID: ${baytAneeqId || 'Not found'}`);
    console.log(`   Ali Hadi ID: 13 (keep this)\n`);

    // Build list of stores to keep
    const storeIdsToKeep = [13];
    if (baytAneeqId) {
      storeIdsToKeep.push(baytAneeqId);
    }

    console.log(`   Keeping stores: ${storeIdsToKeep.join(', ')}`);

    // Get stores to delete
    const storesToDelete = storesResult.rows
      .filter(s => !storeIdsToKeep.includes(s.id))
      .map(s => s.id);

    console.log(`   Deleting stores: ${storesToDelete.length > 0 ? storesToDelete.join(', ') : 'None'}\n`);

    if (storesToDelete.length > 0) {
      // Delete foreign key constraints first
      for (const storeId of storesToDelete) {
        // Delete orders
        await pool.query(`DELETE FROM orders WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted orders from store ${storeId}`);

        // Delete customers
        await pool.query(`DELETE FROM customers WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted customers from store ${storeId}`);

        // Delete products
        await pool.query(`DELETE FROM products WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted products from store ${storeId}`);

        // Delete categories
        await pool.query(`DELETE FROM categories WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted categories from store ${storeId}`);

        // Delete topup products
        await pool.query(`DELETE FROM topup_products WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted topup_products from store ${storeId}`);

        // Delete topup companies
        await pool.query(`DELETE FROM topup_companies WHERE store_id = $1`, [storeId]);
        console.log(`   ✓ Deleted topup_companies from store ${storeId}`);

        // Delete store user
        await pool.query(`DELETE FROM users WHERE store_id = $1 AND role = 'merchant'`, [storeId]);
        console.log(`   ✓ Deleted merchant users from store ${storeId}`);

        // Delete store
        await pool.query(`DELETE FROM stores WHERE id = $1`, [storeId]);
        console.log(`   ✓ Deleted store ${storeId}`);
      }
    }

    // Show remaining stores
    console.log('\n✅ Remaining stores:\n');
    const remainingResult = await pool.query(
      `SELECT id, slug, store_type, is_active FROM stores ORDER BY id`
    );
    
    remainingResult.rows.forEach(s => {
      console.log(`ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type || 'regular'} | Active: ${s.is_active}`);
    });

    await pool.end();
    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupStores();
