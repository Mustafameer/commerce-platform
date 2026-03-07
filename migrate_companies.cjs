const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function migrateCompanies() {
  try {
    console.log('🔄 جاري نقل الشركات من categories إلى topup_companies...\n');

    // احصل على الشركات من جدول categories للمتجر 13
    const categoriesRes = await pool.query(`
      SELECT id, store_id, name FROM categories WHERE store_id = 13
    `);

    console.log(`وجدت ${categoriesRes.rows.length} شركة في جدول categories`);
    
    if (categoriesRes.rows.length === 0) {
      console.log('❌ لا توجد شركات في categories للمتجر 13');
      await pool.end();
      return;
    }

    for (const cat of categoriesRes.rows) {
      // تحقق إذا كانت الشركة موجودة في topup_companies
      const existing = await pool.query(
        `SELECT id FROM topup_companies WHERE store_id = $1 AND name = $2`,
        [cat.store_id, cat.name]
      );

      if (existing.rows.length === 0) {
        // أضف الشركة
        const insertRes = await pool.query(
          `INSERT INTO topup_companies (store_id, name, is_active) 
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
      SELECT * FROM topup_companies WHERE store_id = 13 ORDER BY id
    `);
    console.log(`\n✨ النتيجة النهائية: ${verifyRes.rows.length} شركة في topup_companies`);
    verifyRes.rows.forEach(c => console.log(`  - ✅ ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

migrateCompanies();
