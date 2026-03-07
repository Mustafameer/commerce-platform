const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixConstraint() {
  try {
    console.log('🔧 إصلاح Foreign Key Constraint...\n');

    // حذف الـ constraint القديم
    await pool.query(`
      ALTER TABLE order_items 
      DROP CONSTRAINT IF EXISTS order_items_product_id_fkey
    `);
    console.log('✅ تم حذف الـ constraint القديمة');

    // إضافة constraint جديدة مع ON DELETE CASCADE
    await pool.query(`
      ALTER TABLE order_items 
      ADD CONSTRAINT order_items_product_id_fkey 
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    `);
    console.log('✅ تم إضافة constraint جديدة مع ON DELETE CASCADE');

    console.log('\n✨ الآن يمكنك حذف المنتجات بدون مشاكل');
    console.log('   عند حذف منتج، سيتم حذف جميع الطلبات المرتبطة به تلقائياً\n');

    await pool.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

fixConstraint();
