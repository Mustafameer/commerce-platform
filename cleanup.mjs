import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

(async () => {
  try {
    console.log('📋 الجداول الموجودة:');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    console.log('\n🧹 حذف البيانات...\n');
    
    // حذف العناصر الأساسية
    try {
      await pool.query('DELETE FROM order_items');
      console.log('✅ تم حذف عناصر الطلبات');
    } catch(e) {}
    
    try {
      await pool.query('DELETE FROM orders');
      console.log('✅ تم حذف الطلبات');
    } catch(e) {}
    
    try {
      await pool.query('DELETE FROM product_images');
      console.log('✅ تم حذف صور المنتجات');
    } catch(e) {}
    
    try {
      await pool.query('DELETE FROM products');
      console.log('✅ تم حذف المنتجات');
    } catch(e) {}
    
    try {
      await pool.query('DELETE FROM categories');
      console.log('✅ تم حذف الأقسام');
    } catch(e) {}
    
    try {
      await pool.query('DELETE FROM stores');
      console.log('✅ تم حذف المتاجر');
    } catch(e) {}
    
    try {
      await pool.query('UPDATE users SET store_id = NULL');
      console.log('✅ تم تحديث المستخدمين');
    } catch(e) {}
    
    // التحقق
    console.log('\n📊 الإحصائيات:');
    try {
      const stores = await pool.query('SELECT COUNT(*) as count FROM stores');
      console.log('  المتاجر:', stores.rows[0].count);
    } catch(e) {}
    
    try {
      const categories = await pool.query('SELECT COUNT(*) as count FROM categories');
      console.log('  الأقسام:', categories.rows[0].count);
    } catch(e) {}
    
    try {
      const products = await pool.query('SELECT COUNT(*) as count FROM products');
      console.log('  المنتجات:', products.rows[0].count);
    } catch(e) {}
    
    try {
      const orders = await pool.query('SELECT COUNT(*) as count FROM orders');
      console.log('  الطلبات:', orders.rows[0].count);
    } catch(e) {}
    
    console.log('\n✨ تم التنظيف بنجاح!');
    pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    pool.end();
    process.exit(1);
  }
})();
