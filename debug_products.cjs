const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function debugData() {
  try {
    console.log('🔍 === DEBUG: DETAILED PRODUCT INFO ===\n');

    const prods = await pool.query(
      'SELECT tp.id, tp.company_id, tp.category_id, tp.amount, tc.name as company_name, tpc.name as category_name FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = 13 ORDER BY tp.id'
    );
    
    console.log('Products with IDs:');
    prods.rows.forEach(p => {
      console.log(`   [${p.id}] company_id=${p.company_id}, category_id=${p.category_id} → ${p.company_name} > ${p.category_name} > ${p.amount}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    const cats = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    console.log('Categories with their IDs:');
    cats.rows.forEach(c => {
      const hasProducts = prods.rows.some(p => p.category_id === c.id);
      console.log(`   [${c.id}] ${c.name} ${hasProducts ? '✅' : '❌'}`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugData();
