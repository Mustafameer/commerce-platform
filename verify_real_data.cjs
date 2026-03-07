const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function check() {
  try {
    console.log('=== البيانات الفعلية في قاعدة البيانات للمتجر 13 ===\n');

    // الشركات
    const companiesRes = await pool.query(`
      SELECT tc.* FROM topup_companies tc 
      WHERE tc.store_id = 13 
      ORDER BY tc.id
    `);
    console.log(`💼 الشركات: ${companiesRes.rows.length}`);
    companiesRes.rows.forEach(c => console.log(`  - ID ${c.id}: ${c.name}`));

    // الفئات
    const categoriesRes = await pool.query(`
      SELECT tpc.* FROM topup_product_categories tpc 
      WHERE tpc.store_id = 13 
      ORDER BY tpc.id
    `);
    console.log(`\n📁 الفئات: ${categoriesRes.rows.length}`);
    categoriesRes.rows.forEach(c => console.log(`  - ID ${c.id}: ${c.name}`));

    // المنتجات
    const productsRes = await pool.query(`
      SELECT tp.id, tp.company_id, tp.category_id, tp.amount
      FROM topup_products tp
      WHERE tp.store_id = 13 AND tp.is_active = true
      ORDER BY tp.id
    `);
    console.log(`\n📦 المنتجات النشطة: ${productsRes.rows.length}`);
    productsRes.rows.forEach(p => console.log(`  - ID ${p.id}: Company ${p.company_id} | Category ${p.category_id}`));

    // الشركات التي لها منتجات فعلاً
    const companiesWithProducts = await pool.query(`
      SELECT DISTINCT tc.id, tc.name 
      FROM topup_companies tc
      WHERE tc.store_id = 13 
      AND tc.id IN (SELECT DISTINCT company_id FROM topup_products WHERE store_id = 13 AND is_active = true)
      ORDER BY tc.id
    `);
    console.log(`\n✅ الشركات التي لها منتجات: ${companiesWithProducts.rows.length}`);
    companiesWithProducts.rows.forEach(c => console.log(`  - ${c.name}`));

    // الفئات التي لها منتجات فعلاً
    const categoriesWithProducts = await pool.query(`
      SELECT DISTINCT tpc.id, tpc.name
      FROM topup_product_categories tpc
      WHERE tpc.store_id = 13
      AND tpc.id IN (SELECT DISTINCT category_id FROM topup_products WHERE store_id = 13 AND is_active = true)
      ORDER BY tpc.id
    `);
    console.log(`\n✅ الفئات التي لها منتجات: ${categoriesWithProducts.rows.length}`);
    categoriesWithProducts.rows.forEach(c => console.log(`  - ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
