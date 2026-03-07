const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkProducts() {
  try {
    const res = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13');
    console.log('📊 TOTAL PRODUCTS IN STORE 13: ' + res.rows[0].count);
    
    const res2 = await pool.query(
      'SELECT tp.id, tc.name as company, tpc.name as category, tp.amount, tp.is_active FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = 13 ORDER BY tp.id'
    );
    
    console.log('\nAll Products:');
    res2.rows.forEach(p => {
      const status = p.is_active ? '✅' : '❌';
      console.log(`${status} [${p.id}] ${p.company} > ${p.category} > ${p.amount} IQD`);
    });
    
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkProducts();
