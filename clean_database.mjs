import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('❌ [FATAL] DATABASE_URL not set - cloud-only configuration required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗑️  بدء تنظيف قاعدة البيانات...\n');

    await client.query('BEGIN');

    // 1. حذف جميع الطلبيات والمعاملات
    console.log('🗑️  حذف الطلبيات والمعاملات...');
    try { await client.query('DELETE FROM order_items'); } catch(e) {}
    try { await client.query('DELETE FROM customer_transactions'); } catch(e) {}
    try { await client.query('DELETE FROM customer_payments'); } catch(e) {}
    try { await client.query('DELETE FROM orders'); } catch(e) {}
    try { await client.query('DELETE FROM order_images'); } catch(e) {}
    console.log('   ✅ تم حذف الطلبيات والمعاملات');

    // 2. حذف صور المنتجات
    console.log('🗑️  حذف صور المنتجات...');
    try { await client.query('DELETE FROM topup_product_images'); } catch(e) {}
    try { await client.query('DELETE FROM product_images'); } catch(e) {}
    console.log('   ✅ تم حذف صور المنتجات');

    // 3. حذف المنتجات والشركات والفئات
    console.log('🗑️  حذف المنتجات والشركات والفئات...');
    try { await client.query('DELETE FROM topup_products'); } catch(e) {}
    try { await client.query('DELETE FROM topup_companies'); } catch(e) {}
    try { await client.query('DELETE FROM topup_product_categories'); } catch(e) {}
    try { await client.query('DELETE FROM products'); } catch(e) {}
    try { await client.query('DELETE FROM categories'); } catch(e) {}
    try { await client.query('DELETE FROM companies'); } catch(e) {}
    console.log('   ✅ تم حذف المنتجات والشركات والفئات');

    // 4. حذف العملاء
    console.log('🗑️  حذف العملاء...');
    try { await client.query('DELETE FROM customers'); } catch(e) {}
    console.log('   ✅ تم حذف العملاء');

    // 5. حذف جميع المتاجر
    console.log('🗑️  حذف المتاجر...');
    try { await client.query('DELETE FROM stores'); } catch(e) {}
    console.log('   ✅ تم حذف المتاجر');

    // 6. حذف جميع المستخدمين ما عدا الآدمن
    console.log('🗑️  حذف المستخدمين (ما عدا الآدمن)...');
    try { await client.query('DELETE FROM users WHERE role != \'admin\''); } catch(e) {}
    console.log('   ✅ تم حذف المستخدمين');

    // 7. حذف تطبيقات التاجر
    console.log('🗑️  حذف تطبيقات التاجر...');
    try { await client.query('DELETE FROM merchant_applications WHERE status != \'approved\''); } catch(e) {}
    try { await client.query('DELETE FROM merchant_applications'); } catch(e) {}
    console.log('   ✅ تم حذف تطبيقات التاجر');

    await client.query('COMMIT');
    console.log('\n✅ تم تنظيف قاعدة البيانات بنجاح!');
    console.log('\n📊 الحالة النهائية:');

    // عرض ما تبقى
    try {
      const adminResult = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'admin\'');
      console.log(`   👤 حسابات الآدمن: ${adminResult.rows[0].count}`);
    } catch(e) {}

    try {
      const storesResult = await client.query('SELECT COUNT(*) as count FROM stores');
      console.log(`   🏪 المتاجر: ${storesResult.rows[0].count}`);
    } catch(e) {}

    try {
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`   👥 المستخدمين: ${usersResult.rows[0].count}`);
    } catch(e) {}

    try {
      const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
      console.log(`   📦 المنتجات: ${productsResult.rows[0].count}`);
    } catch(e) {}

    try {
      const ordersResult = await client.query('SELECT COUNT(*) as count FROM orders');
      console.log(`   📋 الطلبيات: ${ordersResult.rows[0].count}`);
    } catch(e) {}

    console.log('\n✨ يمكنك الآن البدء بإنشاء المتاجر والبيانات من الصفر!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
