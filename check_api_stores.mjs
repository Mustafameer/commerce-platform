import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('📋 Checking /api/stores endpoint...\n');
  
  // Get what the API would return
  const stores = await pool.query(`
    SELECT 
      s.id,
      s.store_name,
      s.status,
      s.is_active,
      u.name as owner_name,
      u.phone as owner_phone
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    ORDER BY s.id
  `);
  
  console.log(`Total stores returned: ${stores.rows.length}\n`);
  stores.rows.forEach((s, idx) => {
    console.log(`${idx + 1}. ID ${s.id}: ${s.store_name}`);
    console.log(`   Owner: ${s.owner_name} (${s.owner_phone})`);
    console.log(`   Status: ${s.status}, Active: ${s.is_active}\n`);
  });
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
