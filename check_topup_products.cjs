const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkTopupProducts() {
  try {
    console.log('=== TOPUP PRODUCTS FOR STORE 13 ===\n');
    
    const res = await pool.query(`
      SELECT tp.id, tp.store_id, tp.category_id, tp.company_id, tp.amount, tp.name,
             tc.name as company_name, tpc.name as category_name
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    
    res.rows.forEach(p => {
      console.log(`ID ${p.id}: ${p.company_name} > ${p.category_name} > ${p.amount} (name: "${p.name}")`);
    });

    console.log('\n=== CATEGORIES ===\n');
    
    const cats = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    cats.rows.forEach(c => {
      console.log(`ID ${c.id}: ${c.name}`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTopupProducts();
