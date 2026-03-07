const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // Get schema info
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_products'
      ORDER BY ordinal_position
    `);
    
    console.log('=== TABLE SCHEMA ===');
    res.rows.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));
    
    // Get actual rows
    const productsRes = await pool.query('SELECT * FROM topup_products LIMIT 2');
    console.log('\n=== SAMPLE PRODUCT ===');
    console.log(JSON.stringify(productsRes.rows[0], null, 2));
    
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
