const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    console.log('=== بيانات متجر 13 (علي الهادي) ===\n');

    const companiesRes = await pool.query(`
      SELECT * FROM topup_companies WHERE store_id = 13 ORDER BY id
    `);
    console.log(`💼 الشركات: ${companiesRes.rows.length}`);
    companiesRes.rows.forEach(c => console.log(`  - ${c.name}`));

    const categoriesRes = await pool.query(`
      SELECT * FROM topup_product_categories WHERE store_id = 13 ORDER BY id
    `);
    console.log(`\n📁 الفئات: ${categoriesRes.rows.length}`);
    categoriesRes.rows.forEach(c => console.log(`  - ${c.name}`));

    const productsRes = await pool.query(`
      SELECT * FROM topup_products WHERE store_id = 13 ORDER BY id
    `);
    console.log(`\n📦 المنتجات: ${productsRes.rows.length}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
