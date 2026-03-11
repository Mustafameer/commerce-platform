import poolModule from 'pg';
const { Pool } = poolModule;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  console.log('🔍 Checking stores schema...\n');
  
  // Get table structure
  const schema = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'stores'
    ORDER BY ordinal_position
  `);
  
  console.log('📋 Stores table columns:');
  schema.rows.forEach(col => {
    console.log(`   ${col.column_name}: ${col.data_type}`);
  });
  
  // Now get all stores with whatever fields we have
  const stores = await pool.query('SELECT * FROM stores LIMIT 10');
  console.log(`\n📊 Total stores: ${stores.rowCount}`);
  
  if (stores.rows.length > 0) {
    console.log('\n🏪 First store:');
    console.log(JSON.stringify(stores.rows[0], null, 2));
  }
  
  await pool.end();
  
} catch (error) {
  console.error('Database error:', error.message);
  process.exit(1);
}
