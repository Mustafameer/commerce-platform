import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function removeExtraData() {
  try {
    // الحذف القسري للمتاجر والمستخدمين الزائدين
    console.log('🗑️  حذف المتاجر والمستخدمين الزائدين...\n');

    // أولاً: حذف جميع البيانات المرتبطة
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM customer_transactions');
    await pool.query('DELETE FROM customer_payments');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM order_images');
    await pool.query('DELETE FROM topup_product_images');
    await pool.query('DELETE FROM product_images');
    await pool.query('DELETE FROM topup_products');
    await pool.query('DELETE FROM topup_companies');
    await pool.query('DELETE FROM topup_product_categories');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM customers');
    
    // تحديث المستخدمين لإزالة ارتباط المتجر
    console.log('   ✅ فصل المستخدمين عن المتاجر...');
    await pool.query('UPDATE users SET store_id = NULL WHERE id != 1');
    
    // حذف المستخدمين غير الآدمن
    console.log('   ✅ حذف المستخدمين غير الآدمن...');
    await pool.query('DELETE FROM users WHERE id != 1');
    
    // ثم: حذف جميع المتاجر
    console.log('   ✅ حذف المتاجر...');
    await pool.query('DELETE FROM stores');

    // عرض النتائج النهائية
    const adminResult = await pool.query('SELECT id, name, phone, email, role FROM users WHERE id = 1');
    console.log('\n✅ النتائج النهائية:');
    console.log('   الآدمن المتبقي:');
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Name: ${admin.name}`);
      console.log(`   - Phone: ${admin.phone}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Role: ${admin.role}`);
    }

    const storesResult = await pool.query('SELECT COUNT(*) as count FROM stores');
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');

    console.log('\n📊 إحصائيات قاعدة البيانات:');
    console.log(`   🏪 المتاجر: ${storesResult.rows[0].count}`);
    console.log(`   👥 المستخدمين: ${usersResult.rows[0].count}`);
    console.log(`   📦 المنتجات: ${productsResult.rows[0].count}`);
    console.log(`   📋 الطلبيات: ${ordersResult.rows[0].count}`);

    console.log('\n✨ تم تنظيف قاعدة البيانات بالكامل!');
    console.log('🚀 الآن يمكنك البدء بإنشاء المتاجر والبيانات من الصفر...\n');

    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

removeExtraData();
