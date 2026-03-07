const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkData() {
  try {
    console.log('🔍 === CHECKING CURRENT DATA ===\n');

    const cats = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    console.log('📂 All Categories:');
    cats.rows.forEach(c => {
      console.log(`   ID ${c.id}: ${c.name}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    const prods = await pool.query(
      'SELECT tp.id, tc.name as company, tpc.name as category, tp.amount FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = 13 ORDER BY tp.category_id'
    );
    
    console.log(`📦 All Products (${prods.rows.length} total):`);
    prods.rows.forEach(p => {
      console.log(`   ${p.company} > ${p.category} > ${p.amount}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Find categories without products
    const catIds = new Set(prods.rows.map(p => p.category));
    console.log('❌ Categories WITHOUT products:');
    cats.rows.forEach(c => {
      if (!prods.rows.some(p => p.category_id === c.id)) {
        console.log(`   ID ${c.id}: ${c.name} (لا توجد منتجات)`);
      }
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
