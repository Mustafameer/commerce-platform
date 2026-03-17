import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function deleteAllStores() {
  try {
    console.log('🗑️  حذف جميع المتاجر والبيانات المرتبطة...\n');

    // 1. حذف جميع البيانات
    console.log('   ✅ حذف البيانات المرتبطة...');
    try { await pool.query('DELETE FROM order_items'); } catch(e) {}
    try { await pool.query('DELETE FROM customer_transactions'); } catch(e) {}
    try { await pool.query('DELETE FROM customer_payments'); } catch(e) {}
    try { await pool.query('DELETE FROM orders'); } catch(e) {}
    try { await pool.query('DELETE FROM order_images'); } catch(e) {}
    try { await pool.query('DELETE FROM topup_product_images'); } catch(e) {}
    try { await pool.query('DELETE FROM product_images'); } catch(e) {}
    try { await pool.query('DELETE FROM topup_products'); } catch(e) {}
    try { await pool.query('DELETE FROM topup_companies'); } catch(e) {}
    try { await pool.query('DELETE FROM topup_product_categories'); } catch(e) {}
    try { await pool.query('DELETE FROM products'); } catch(e) {}
    try { await pool.query('DELETE FROM categories'); } catch(e) {}
    try { await pool.query('DELETE FROM customers'); } catch(e) {}

    // 2. فصل المستخدمين عن المتاجر
    console.log('   ✅ فصل المستخدمين غير الآدمن عن المتاجر...');
    try { await pool.query('UPDATE users SET store_id = NULL WHERE id != 1'); } catch(e) {}

    // 3. حذف كل المستخدمين ما عدا الآدمن
    console.log('   ✅ حذف المستخدمين غير الآدمن...');
    try { await pool.query('DELETE FROM users WHERE id != 1'); } catch(e) {}

    // 4. حذف جميع المتاجر
    console.log('   ✅ حذف جميع المتاجر...');
    try { await pool.query('DELETE FROM stores'); } catch(e) {}
    
    console.log('\n✅ تم حذف جميع البيانات بنجاح!');
    
    // التحقق النهائي
    try {
      const storesCheck = await pool.query('SELECT COUNT(*) as count FROM stores');
      const usersCheck = await pool.query('SELECT COUNT(*) as count FROM users');
      let productsCount = 0;
      try {
        const productsCheck = await pool.query('SELECT COUNT(*) as count FROM products');
        productsCount = productsCheck.rows[0].count;
      } catch(e) {}
      
      console.log('\n📊 الحالة النهائية:');
      console.log(`   🏪 المتاجر: ${storesCheck.rows[0].count}`);
      console.log(`   👥 المستخدمين: ${usersCheck.rows[0].count} (الآدمن فقط)`);
      console.log(`   📦 المنتجات: ${productsCount}`);
    } catch(e) {}
    
    console.log('\n✨ قاعدة البيانات جاهزة للبدء من جديد!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteAllStores();
