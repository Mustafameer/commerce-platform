const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function deleteAll() {
  try {
    console.log('🔴 جاري حذف جميع البيانات للمتجر 13...\n');

    // 1. حذف المنتجات
    const productsRes = await pool.query(
      `DELETE FROM topup_products WHERE store_id = 13`
    );
    console.log(`✅ تم حذف ${productsRes.rowCount} منتج`);

    // 2. حذف الفئات
    const categoriesRes = await pool.query(
      `DELETE FROM topup_product_categories WHERE store_id = 13`
    );
    console.log(`✅ تم حذف ${categoriesRes.rowCount} فئة`);

    // 3. حذف الشركات
    const companiesRes = await pool.query(
      `DELETE FROM topup_companies WHERE store_id = 13`
    );
    console.log(`✅ تم حذف ${companiesRes.rowCount} شركة`);

    console.log('\n✨ تم حذف جميع البيانات بنجاح');
    console.log('🎯 الآن يمكنك إدخال الأقسام والشركات الجديدة');

    // التحقق من النتيجة
    const verify = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM topup_products WHERE store_id = 13) as products,
        (SELECT COUNT(*) FROM topup_product_categories WHERE store_id = 13) as categories,
        (SELECT COUNT(*) FROM topup_companies WHERE store_id = 13) as companies
    `);
    const result = verify.rows[0];
    console.log(`\n📊 الحالة الحالية:`);
    console.log(`  - منتجات: ${result.products}`);
    console.log(`  - فئات: ${result.categories}`);
    console.log(`  - شركات: ${result.companies}`);

    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

deleteAll();
