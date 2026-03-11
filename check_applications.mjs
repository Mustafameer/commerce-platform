import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Checking merchant_applications table...\n');
  
  // Get all merchant applications
  const apps = await pool.query('SELECT * FROM merchant_applications ORDER BY id');
  console.log(`📊 Total applications: ${apps.rows.length}\n`);
  
  if (apps.rows.length > 0) {
    console.log('📋 All merchant applications:');
    apps.rows.forEach((app, idx) => {
      console.log(`\n${idx + 1}. Entry ID: ${app.id}`);
      console.log(`   Store ID: ${app.store_id}`);
      console.log(`   Store Name: ${app.store_name}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Date: ${app.created_at}`);
    });
  } else {
    console.log('No records in merchant_applications');
  }
  
  // Count by status
  const bystatus = await pool.query(`
    SELECT status, COUNT(*) as count 
    FROM merchant_applications 
    GROUP BY status
  `);
  
  console.log(`\n📊 Applications by status:`);
  bystatus.rows.forEach(row => {
    console.log(`  ${row.status}: ${row.count}`);
  });
  
  await pool.end();
  
} catch (error) {
  console.error('Error:', error.message);
}
