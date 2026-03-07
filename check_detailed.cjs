const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // Get detailed info
    const res = await pool.query(`
      SELECT id, store_id, category_id, company_id, amount, is_active, name 
      FROM topup_products 
      WHERE store_id = 13
      ORDER BY id
    `);
    
    console.log('=== ALL PRODUCTS ===');
    res.rows.forEach(p => {
      console.log(`ID: ${p.id}, Store: ${p.store_id}, Category: ${p.category_id}, Company: ${p.company_id}, Amount: ${p.amount}, Active: ${p.is_active}, Name: ${p.name}`);
    });
    
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
