import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Checking what /api/stores endpoint returns...\n');
  
  // Simulate exactly what the API endpoint does
  const result = await pool.query(`
    SELECT s.*, u.name as owner_name_from_user, u.phone as owner_phone_from_user, u.email as owner_email_from_user
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    ORDER BY s.created_at DESC
  `);
  
  const stores = result.rows.map(store => ({
    ...store,
    owner_name: store.owner_name || store.owner_name_from_user || 'غير معروف',
    owner_phone: store.owner_phone || store.owner_phone_from_user || '',
    owner_email: store.owner_email || store.owner_email_from_user || ''
  }));
  
  console.log(`Total stores from API: ${stores.length}\n`);
  
  // Now check if merchant_applications are being used
  const apps = await pool.query(`
    SELECT * FROM merchant_applications ORDER BY id DESC
  `);
  
  console.log(`Total merchant applications: ${apps.rows.length}`);
  console.log(`Applications by status:`);
  
  const appsByStatus = {};
  apps.rows.forEach(app => {
    if (!appsByStatus[app.status]) appsByStatus[app.status] = 0;
    appsByStatus[app.status]++;
  });
  
  Object.entries(appsByStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  console.log(`\n✅ If showing 3 stores but DB has 2 + apps with status...`);
  console.log(`Total if combining stores + 1 app: ${stores.length + 1}`);
  
  // Check if there's any query that combines Both
  console.log('\n🔍 Checking if /api/stores might be modified to include applications...');
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
