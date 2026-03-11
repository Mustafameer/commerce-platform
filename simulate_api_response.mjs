import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
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
  
  console.log('🔍 Simulating /api/stores endpoint response...\n');
  console.log(`✅ Total stores to return: ${stores.length}\n`);
  
  stores.forEach((s, idx) => {
    console.log(`${idx + 1}. ID: ${s.id}, Name: ${s.store_name}, Status: ${s.status}`);
  });
  
  // Check if maybe there's a different endpoint being called
  console.log('\n🔍 Checking for other store-related endpoints...');
  
  // Maybe the frontend is also adding merchant applications?
  const apps = await pool.query('SELECT COUNT(*) as count FROM merchant_applications');
  console.log(`\nmerchant_applications count: ${apps.rows[0].count}`);
  
  // Maybe combining them?
  console.log(`\nTotal if combined (stores + 1 pending app):  ${stores.length + 1}`);
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
