import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

(async () => {
  try {
    // Check all topup_products
    const productsCount = await pool.query('SELECT COUNT(*) as count FROM topup_products');
    console.log('📦 عدد منتجات الشحن:', productsCount.rows[0].count);

    // Check all images
    const imagesCount = await pool.query('SELECT COUNT(*) as count FROM topup_product_images');
    console.log('🖼️  عدد الصور المحفوظة:', imagesCount.rows[0].count);

    // Get all products with their images
    const allProducts = await pool.query('SELECT id, store_id, company_id, amount, price, images FROM topup_products');
    
    if (allProducts.rows.length > 0) {
      console.log('\n📋 جميع منتجات الشحن:');
      console.log('═════════════════════════════════════');
      allProducts.rows.forEach(p => {
        const imageCount = p.images ? p.images.length : 0;
        console.log(`\nالمنتج #${p.id}:`);
        console.log(`  المبلغ: ${p.amount} ريال`);
        console.log(`  السعر: ${p.price} ريال`);
        console.log(`  الصور: ${imageCount}`);
        if (p.images && p.images.length > 0) {
          p.images.forEach((img, idx) => {
            console.log(`    ${idx + 1}. ${img}`);
          });
        }
      });
    } else {
      console.log('❌ لم تضف أي منتج حتى الآن');
    }

    // Check Firebase config
    console.log('\n🔥 حالة Firebase:');
    console.log('═════════════════════════════════════');
    if (process.env.FIREBASE_PROJECT_ID) {
      console.log('✅ Firebase ENABLED');
      console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      console.log('❌ Firebase DISABLED');
      console.log('   استخدام المخزن المحلي (/uploads)');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
})();
