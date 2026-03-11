import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Full database investigation...\n');
  
  // Count all stores without any filters
  const allStores = await pool.query('SELECT COUNT(*) as count FROM stores');
  console.log(`📊 Total stores in DB: ${allStores.rows[0].count}`);
  
  // List all stores
  const stores = await pool.query('SELECT id, store_name, status, is_active FROM stores ORDER BY id');
  console.log(`\n📋 All stores in database:`);
  stores.rows.forEach(s => {
    console.log(`  ID ${s.id}: ${s.store_name} (status: ${s.status}, active: ${s.is_active})`);
  });
  
  // Check if there's some table we're missing
  const allTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  console.log(`\n📑 All tables in database:`);
  allTables.rows.forEach((t, idx) => {
    console.log(`  ${idx + 1}. ${t.table_name}`);
  });
  
  // Check if there's a archive or deleted_stores table
  const archived = await pool.query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('deleted_stores', 'archived_stores', 'store_archive')
  `);
  
  if (archived.rows[0].count > 0) {
    console.log('\n⚠️  Found archive tables!');
  }
  
  // Check users to see how many have store_id
  const usersWithStores = await pool.query(`
    SELECT COUNT(*) as total_users,
           SUM(CASE WHEN store_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_store
    FROM users
  `);
  
  console.log(`\n👥 Users info:`);
  console.log(`  Total users: ${usersWithStores.rows[0].total_users}`);
  console.log(`  Users with store_id: ${usersWithStores.rows[0].users_with_store}`);
  
  await pool.end();
  
} catch (error) {
  console.error('Error:', error.message);
}
