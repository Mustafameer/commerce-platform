import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  // Just count stores
  const result = await pool.query('SELECT COUNT(*) as count FROM stores');
  console.log('✅ Total stores:', result.rows[0].count);
  
  // List them
  const stores = await pool.query('SELECT id, title, status, is_active FROM stores ORDER BY id');
  stores.rows.forEach(s => {
    console.log(`  - ID ${s.id}: ${s.title} (status: ${s.status}, active: ${s.is_active})`);
  });
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
}
