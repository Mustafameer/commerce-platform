import pkg from 'pg';
const { Pool } = pkg;

const connectionString = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';

const pool = new Pool({
  connectionString,
  ssl: false
});

async function verifyDatabase() {
  try {
    console.log('\n📋 التحقق من قاعدة البيانات المحلية...\n');

    // 1️⃣ التحقق من المتجر
    const store = await pool.query(`
      SELECT * FROM stores WHERE id = 13
    `);
    console.log('🏪 محلات:', store.rows.length);
    if (store.rows.length > 0) {
      console.log(`   ✅ ${store.rows[0].store_name} (ID: ${store.rows[0].id})\n`);
    }

    // 2️⃣ التحقق من الشركات
    const companies = await pool.query(`
      SELECT * FROM topup_companies WHERE store_id = 13
    `);
    console.log('🏢 شركات الشحن:', companies.rows.length);
    companies.rows.forEach(c => {
      console.log(`   ✅ ${c.name} (ID: ${c.id})`);
    });
    console.log();

    // 3️⃣ التحقق من المنتجات
    const products = await pool.query(`
      SELECT tp.id, tp.amount, tp.price, tc.name as company_name
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    console.log('📦 منتجات الشحن:', products.rows.length);
    products.rows.forEach(p => {
      console.log(`   ✅ المبلغ: ${p.amount} ريال | السعر: ${p.price} ريال | الشركة: ${p.company_name} (ID: ${p.id})`);
    });
    console.log();

    // 4️⃣ التحقق من الصور
    const images = await pool.query(`
      SELECT tpi.id, tpi.topup_product_id, tpi.image_type, 
             LENGTH(tpi.image_data) as image_size,
             tp.amount, tc.name as company_name
      FROM topup_product_images tpi
      JOIN topup_products tp ON tpi.topup_product_id = tp.id
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      ORDER BY tpi.topup_product_id
    `);
    console.log('🖼️  صور الشحن:', images.rows.length);
    images.rows.forEach(img => {
      console.log(`   ✅ المنتج ID: ${img.topup_product_id} | المبلغ: ${img.amount} | الشركة: ${img.company_name} | حجم الصورة: ${img.image_size} bytes`);
    });
    console.log();

    // 5️⃣ اختبار النقطة النهائية
    console.log('🔍 محتوى الصورة (عينة):\n');
    if (images.rows.length > 0) {
      const firstImage = images.rows[0].image_data.substring(0, 100);
      console.log(`   ${firstImage}...\n`);
    }

    console.log('✅ قاعدة البيانات جاهزة للاختبار!\n');
    console.log('الخطوة التالية:');
    console.log('1. شغل السرفر محلياً: npm run dev');
    console.log('2. افتح متصفح: http://localhost:5000/api/setup/images-table');
    console.log('3. تأكد من ظهور JSON بدون أخطاء\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
