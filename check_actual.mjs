import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkActualData() {
  try {
    console.log('🔍 === CHECKING ACTUAL STORE 13 DATA ===\n');

    // Get all products with details
    const result = await pool.query(
      `SELECT 
        tp.id, tc.name as company_name, tpc.name as category_name, tp.amount, tp.price, tp.is_active
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = 13
       ORDER BY tp.id`
    );

    console.log(`📦 Total products in store 13: ${result.rows.length}\n`);
    result.rows.forEach((p, i) => {
      console.log(`   [${p.id}] ${p.company_name} > ${p.category_name} > ${p.amount} IQD (Active: ${p.is_active})`);
    });

    // Get categories
    const categories = await pool.query(
      `SELECT id, name FROM topup_product_categories WHERE store_id = 13`
    );
    console.log(`\n📂 Categories: ${categories.rows.length}`);
    categories.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkActualData();
