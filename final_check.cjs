const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    // List all products
    const res = await pool.query(`
      SELECT id, store_id, company_id, category_id, amount, is_active
      FROM topup_products 
      ORDER BY id
    `);
    
    console.log('=== ALL PRODUCTS FOR STORE 13 ===');
    console.log('Total:', res.rows.length);
    res.rows.forEach(p => {
      console.log(`ID: ${p.id}, Store: ${p.store_id}, Company: ${p.company_id}, Category: ${p.category_id}, Amount: ${p.amount}, Active: ${p.is_active}`);
    });
    
    // Now list with joins
    console.log('\n=== WITH COMPANY & CATEGORY NAMES ===');
    const res2 = await pool.query(`
      SELECT tp.id, tp.category_id, tp.company_id, tc.name as company_name, tpc.name as category_name, tp.amount
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    
    res2.rows.forEach(p => {
      console.log(`ID: ${p.id}, Company: ${p.company_name}, Category: ${p.category_name}, Amount: ${p.amount}`);
    });
    
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
}

check();
