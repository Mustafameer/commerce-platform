const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM topup_products WHERE store_id = 13');
    console.log('Total products:', res.rows.length);
    res.rows.forEach(p => {
      console.log('ID:', p.id, 'Cat:', p.category_id, 'Company:', p.company_id, 'Amount:', p.amount);
    });
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
