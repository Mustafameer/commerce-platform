import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Current store count in database...\n');
  
  // Get exact count
  const count = await pool.query('SELECT COUNT(*) as total FROM stores');
  console.log(`📊 Total stores: ${count.rows[0].total}\n`);
  
  // List all stores with all details
  const stores = await pool.query(`
    SELECT 
      id,
      store_name,
      owner_name,
      owner_phone,
      status,
      is_active,
      created_at
    FROM stores
    ORDER BY id DESC
  `);
  
  console.log('📋 All stores in database:');
  console.log('─'.repeat(100));
  stores.rows.forEach((s, idx) => {
    console.log(`\n${idx + 1}. ID: ${s.id}`);
    console.log(`   Name: ${s.store_name}`);
    console.log(`   Owner: ${s.owner_name} (${s.owner_phone})`);
    console.log(`   Status: ${s.status}, Active: ${s.is_active}`);
    console.log(`   Created: ${new Date(s.created_at).toLocaleString()}`);
  });
  
  console.log('\n' + '─'.repeat(100));
  
  // Check what the API would return for admin/stats
  const statsResult = await pool.query("SELECT COUNT(*) as count FROM stores");
  console.log(`\n✅ /api/admin/stats would return totalStores: ${statsResult.rows[0].count}`);
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
