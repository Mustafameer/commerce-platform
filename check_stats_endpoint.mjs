import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Simulating /api/admin/stats response...\n');
  
  const salesStatuses = ['pending', 'completed'];
  
  // This is exactly what the endpoint does
  const storesResult = await pool.query("SELECT COUNT(*) as count FROM stores");
  const ordersResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = ANY($1::text[])", [salesStatuses]);
  const customersResult = await pool.query("SELECT COUNT(DISTINCT customer_id) as count FROM orders WHERE customer_id IS NOT NULL AND status = ANY($1::text[])", [salesStatuses]);
  const usersResult = await pool.query("SELECT COUNT(*) as count FROM users");
  
  console.log('📊 /api/admin/stats would return:');
  console.log(`  totalStores: ${storesResult.rows[0].count} ✅`);
  console.log(`  totalOrders: ${ordersResult.rows[0].count}`);
  console.log(`  totalCustomers: ${customersResult.rows[0].count}`);
  console.log(`  totalUsers: ${usersResult.rows[0].count}`);
  
  console.log('\n💾 So the stats API correctly returns totalStores = ' + storesResult.rows[0].count);
  
  // Also check the filteredStores in React
  console.log('\n📋 Problem Analysis:');
  console.log('If frontend shows 3 stores but DB+API both return 2...');
  console.log('Then it must be using stores.length from React state');
  console.log('which might have old data or be initialized incorrectly.');
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
