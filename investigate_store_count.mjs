import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Checking stores count...\n');
  
  // Get all stores
  const allStores = await pool.query('SELECT id, name, status, is_active FROM stores ORDER BY id');
  console.log(`Total stores in DB: ${allStores.rows.length}`);
  console.log('\n📋 All Stores:');
  allStores.rows.forEach(store => {
    console.log(`   ID: ${store.id}, Name: ${store.name}, Status: ${store.status}, Active: ${store.is_active}`);
  });
  
  // Count by status
  const counts = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' AND is_active = false THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN (status = 'approved' OR status = 'active') AND is_active = true THEN 1 ELSE 0 END) as approved
    FROM stores
  `);
  
  console.log('\n📊 Store Counts:');
  console.log(`   Total: ${counts.rows[0].total}`);
  console.log(`   Pending: ${counts.rows[0].pending || 0}`);
  console.log(`   Approved: ${counts.rows[0].approved || 0}`);
  
  // Check if there are any soft-deleted or hidden stores
  const withDeleted = await pool.query(`
    SELECT COUNT(*) as count, 
           SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_status,
           SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_status
    FROM stores
  `);
  
  console.log('\n🔎 Other Status Info:');
  console.log(`   NULL status stores: ${withDeleted.rows[0].null_status || 0}`);
  console.log(`   Deleted status stores: ${withDeleted.rows[0].deleted_status || 0}`);
  
  // Now check if there's a mismatch with users table
  const usersWithStore = await pool.query(`
    SELECT COUNT(DISTINCT store_id) as distinct_store_ids
    FROM users
    WHERE store_id IS NOT NULL
  `);
  
  console.log('\n👥 Users Table Info:');
  console.log(`   Distinct store_ids referenced in users: ${usersWithStore.rows[0].distinct_store_ids}`);
  
  // Find if there are store_ids in users that don't exist in stores table
  const orphanedStoreIds = await pool.query(`
    SELECT DISTINCT u.store_id, COUNT(u.id) as user_count
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.store_id IS NOT NULL AND s.id IS NULL
    GROUP BY u.store_id
  `);
  
  if (orphanedStoreIds.rows.length > 0) {
    console.log('\n⚠️  Orphaned store IDs in users table:');
    orphanedStoreIds.rows.forEach(row => {
      console.log(`   Store ID: ${row.store_id}, User count: ${row.user_count}`);
    });
  } else {
    console.log('\n✅ No orphaned store IDs found');
  }
  
  await pool.end();
  
} catch (error) {
  console.error('Database error:', error);
  process.exit(1);
}
