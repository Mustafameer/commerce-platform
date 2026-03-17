import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function test() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_products'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 TOPUP_PRODUCTS TABLE SCHEMA:\n');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    pool.end();
  }
}

test();
