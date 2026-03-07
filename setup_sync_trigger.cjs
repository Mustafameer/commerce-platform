const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function setup() {
  try {
    console.log('🔧 جاري إنشاء trigger لنقل الأقسام تلقائياً...\n');

    // 1. نقل الأقسام الحالية المفقودة
    console.log('1️⃣ نقل الأقسام الموجودة...');
    const categoriesRes = await pool.query(`
      SELECT id, store_id, name FROM categories WHERE store_id = 13
    `);

    for (const cat of categoriesRes.rows) {
      const existing = await pool.query(
        `SELECT id FROM topup_companies WHERE store_id = $1 AND name = $2`,
        [cat.store_id, cat.name]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO topup_companies (store_id, name, is_active) VALUES ($1, $2, true)`,
          [cat.store_id, cat.name]
        );
        console.log(`  ✅ تم نقل: "${cat.name}"`);
      }
    }

    // 2. إنشاء trigger
    console.log('\n2️⃣ إنشاء trigger...');
    
    // حذف الـ trigger القديم إن وجد
    await pool.query(`
      DROP TRIGGER IF EXISTS sync_categories_to_companies ON categories
    `);

    // حذف الـ function القديمة
    await pool.query(`
      DROP FUNCTION IF EXISTS sync_categories_to_companies()
    `);

    // إنشاء function
    await pool.query(`
      CREATE OR REPLACE FUNCTION sync_categories_to_companies()
      RETURNS TRIGGER AS $$
      BEGIN
        -- عند إضافة قسم جديد، تحقق إذا كان موجود في topup_companies
        IF NEW.store_id = 13 THEN
          -- تحقق من وجود الشركة
          IF NOT EXISTS (
            SELECT 1 FROM topup_companies 
            WHERE store_id = NEW.store_id AND name = NEW.name
          ) THEN
            -- أضف الشركة
            INSERT INTO topup_companies (store_id, name, is_active, created_at)
            VALUES (NEW.store_id, NEW.name, true, NOW());
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // إنشاء trigger
    await pool.query(`
      CREATE TRIGGER sync_categories_to_companies
      AFTER INSERT ON categories
      FOR EACH ROW
      EXECUTE FUNCTION sync_categories_to_companies()
    `);

    console.log('✅ تم إنشاء trigger بنجاح');

    // التحقق
    console.log('\n✨ التحقق من النتيجة:');
    const verifyRes = await pool.query(`
      SELECT * FROM topup_companies WHERE store_id = 13 ORDER BY id
    `);
    console.log(`الشركات الحالية: ${verifyRes.rows.length}`);
    verifyRes.rows.forEach(c => console.log(`  - ${c.name}`));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setup();
