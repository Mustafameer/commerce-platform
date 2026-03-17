import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@junction.proxy.rlwy.net:18175/railway',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function ensureTopupStore() {
  try {
    console.log('🔍 Checking for existing topup stores on Railway...\n');

    // Get store count
    const storeCount = await pool.query('SELECT COUNT(*) as count FROM stores');
    console.log(`📊 Total stores on Railway: ${storeCount.rows[0].count}`);

    // Check for topup stores
    const topupStores = await pool.query(
      `SELECT id, store_name, store_type FROM stores WHERE store_type = 'topup' ORDER BY id`
    );
    console.log(`📊 Topup stores found: ${topupStores.rows.length}`);
    if (topupStores.rows.length > 0) {
      console.log('✅ Existing topup stores:');
      topupStores.rows.forEach(s => {
        console.log(`   - ID: ${s.id}, Name: ${s.store_name}, Type: ${s.store_type}`);
      });
      return;
    }

    // Check if we can insert with id=1
    const store1Check = await pool.query('SELECT id FROM stores WHERE id = 1');
    if (store1Check.rows.length === 0) {
      console.log('❌ Store ID 1 does not exist - attempting to create...\n');
      try {
        const insertResult = await pool.query(
          `INSERT INTO stores (store_name, slug, owner_name, owner_phone, category, status, is_active, store_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, store_name, store_type`,
          ['علي الهادي', 'topup-main-store', 'Topup Admin', '', 'شحن', 'approved', true, 'topup']
        );
        console.log(`✅ Created topup store successfully:`);
        console.log(`   Store ID: ${insertResult.rows[0].id}`);
        console.log(`   Store Name: ${insertResult.rows[0].store_name}`);
        console.log(`   Store Type: ${insertResult.rows[0].store_type}`);
      } catch (insertErr) {
        console.error('❌ Failed to create store:', insertErr.message);
      }
    } else {
      console.log('ℹ️  Store ID 1 exists, checking store type...');
      const store1Info = await pool.query('SELECT store_name, store_type FROM stores WHERE id = 1');
      console.log(`   Name: ${store1Info.rows[0].store_name}`);
      console.log(`   Type: ${store1Info.rows[0].store_type}`);
      if (store1Info.rows[0].store_type !== 'topup') {
        console.log('⚠️  Store 1 exists but is not marked as topup. Attempting to update...');
        await pool.query(
          'UPDATE stores SET store_type = $1 WHERE id = 2',
          ['topup']
        );
        console.log('✅ Updated store 1 to topup type');
      }
    }

    // Final check
    const finalCheck = await pool.query(
      `SELECT id FROM stores WHERE store_type = 'topup' LIMIT 1`
    );
    if (finalCheck.rows.length > 0) {
      console.log(`\n✅ Topup store is ready: ID ${finalCheck.rows[0].id}`);
    } else {
      console.log('\n❌ Still no topup store found');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

ensureTopupStore();
