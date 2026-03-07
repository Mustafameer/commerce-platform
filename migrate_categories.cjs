const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function migrate() {
  try {
    console.log('🔄 جاري نقل البيانات من categories إلى topup_product_categories...\n');

    // نقل الفئات من categories إلى topup_product_categories
    const categoriesRes = await pool.query(`
      SELECT id, store_id, name FROM categories WHERE store_id = 13
    `);

    console.log(`وجدت ${categoriesRes.rows.length} فئة في جدول categories`);

    for (const cat of categoriesRes.rows) {
      // تحقق إذا كانت الفئة موجودة في topup_product_categories
      const existing = await pool.query(
        `SELECT id FROM topup_product_categories WHERE store_id = $1 AND name = $2`,
        [cat.store_id, cat.name]
      );

      if (existing.rows.length === 0) {
        // أضف الفئة
        const insertRes = await pool.query(
          `INSERT INTO topup_product_categories (store_id, name, is_active) 
           VALUES ($1, $2, true) RETURNING id`,
          [cat.store_id, cat.name]
        );
        console.log(`✅ تم إضافة: "${cat.name}" (ID: ${insertRes.rows[0].id})`);
      } else {
        console.log(`⏭️ موجودة بالفعل: "${cat.name}"`);
      }
    }

    // التحقق من النتيجة
    const verifyRes = await pool.query(`
      SELECT * FROM topup_product_categories WHERE store_id = 13 ORDER BY id
    `);
    console.log(`\n✨ النتيجة النهائية: ${verifyRes.rows.length} فئة`);
    verifyRes.rows.forEach(c => console.log(`  - ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

migrate();
