const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    const query = `
      SELECT tp.*, tc.name as company_name, tpc.name as category_name
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13 AND tp.is_active = true
      ORDER BY tp.company_id, tp.category_id, tp.amount
    `;
    
    const res = await pool.query(query);
    console.log('Products from API query:', res.rows.length);
    res.rows.forEach(p => {
      console.log('ID:', p.id, 'Company:', p.company_name, 'Category:', p.category_name, 'Amount:', p.amount, 'Active:', p.is_active);
    });
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
