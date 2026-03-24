import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupExternalImages() {
  try {
    console.log('🧹 تنظيف الصور الخارجية من قاعدة البيانات\n');

    // Find products with external image URLs
    const findResult = await pool.query(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url LIKE '%via.placeholder%' 
         OR image_url LIKE '%https://%' 
         OR image_url LIKE '%http://%'
    `);

    console.log(`📋 وجدت ${findResult.rows.length} منتج بصور خارجية\n`);

    if (findResult.rows.length > 0) {
      console.log('المنتجات المراد تنظيفها:');
      findResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, الاسم: ${row.name}`);
        console.log(`    الصورة الحالية: ${row.image_url}`);
      });

      // Update products to remove external images
      const updateResult = await pool.query(`
        UPDATE products 
        SET image_url = NULL 
        WHERE image_url LIKE '%via.placeholder%' 
           OR image_url LIKE '%https://%' 
           OR image_url LIKE '%http://%'
      `);

      console.log(`\n✅ تم تنظيف ${updateResult.rowCount} منتج`);
    }

    // Verify
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as external_count
      FROM products 
      WHERE image_url LIKE '%https://%' OR image_url LIKE '%http://%'
    `);

    const remaining = verifyResult.rows[0].external_count;
    console.log(`\n📊 الصور الخارجية المتبقية: ${remaining}`);

    if (remaining === 0) {
      console.log('✅ اكتمل التنظيف بنجاح!');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

cleanupExternalImages();
