import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function cleanupStore1() {
  try {
    console.log('🧹 تنظيف منتجات store 1...\n');
    
    // Find problematic products
    console.log('🔍 البحث عن المنتجات الفارغة:');
    const badProducts = await pool.query(
      `SELECT id, amount, price, retail_price, array_length(images, 1) as images_count
       FROM topup_products
       WHERE store_id = 1 AND (amount = 0 OR price = 0 OR amount IS NULL OR price IS NULL)`
    );
    
    if (badProducts.rows.length > 0) {
      console.log(`⚠️ وجدت ${badProducts.rows.length} منتج فارغ:`);
      badProducts.rows.forEach(p => {
        console.log(`  - ID: ${p.id} | المبلغ: ${p.amount} | السعر: ${p.price}`);
      });
      
      // Delete them
      const ids = badProducts.rows.map(p => p.id);
      const deleteRes = await pool.query(
        `DELETE FROM topup_products WHERE id = ANY($1)`,
        [ids]
      );
      console.log(`\n✅ تم حذف ${deleteRes.rowCount} منتج فارغ\n`);
    } else {
      console.log('✅ لا توجد منتجات فارغة\n');
    }
    
    // Find products without images
    console.log('🔍 البحث عن المنتجات بدون صور:');
    const noImages = await pool.query(
      `SELECT id, company_id, amount, price, array_length(images, 1) as images_count
       FROM topup_products
       WHERE store_id = 1 AND (images IS NULL OR array_length(images, 1) = 0)`
    );
    
    if (noImages.rows.length > 0) {
      console.log(`⚠️ وجدت ${noImages.rows.length} منتج بدون صور:`);
      noImages.rows.forEach(p => {
        console.log(`  - ID: ${p.id} | المبلغ: ${p.amount} | السعر: ${p.price}`);
      });
    } else {
      console.log('✅ جميع المنتجات لها صور\n');
    }
    
    // Show final count
    console.log('\n📊 الإجمالي النهائي:');
    const finalCount = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as with_images
       FROM topup_products
       WHERE store_id = 1`
    );
    
    console.log(`  المنتجات الكلية: ${finalCount.rows[0].total}`);
    console.log(`  المنتجات بصور: ${finalCount.rows[0].with_images}`);
    
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

cleanupStore1();
