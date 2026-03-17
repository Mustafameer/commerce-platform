import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false,
});

(async () => {
  try {
    console.log('📋 Users table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    schemaResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n📊 Sample users:');
    const usersResult = await pool.query('SELECT * FROM users LIMIT 1');
    console.log(usersResult.rows[0]);
    
    await pool.end();
  } catch(e) {
    console.log('❌ Error:', e.message);
    await pool.end();
  }
})();
