import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 جاري تنظيف قاعدة البيانات...\n');
    
    // Check for orphaned customer_transactions (transactions with non-existent customer_id)
    console.log('🔍 البحث عن معاملات يتيمة...');
    const orphanTxRes = await client.query(`
      SELECT ct.id, ct.customer_id, ct.amount, ct.created_at
      FROM customer_transactions ct
      LEFT JOIN customers c ON ct.customer_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (orphanTxRes.rows.length > 0) {
      console.log(`⚠️  وجدت ${orphanTxRes.rows.length} معاملة يتيمة`);
      
      // Delete orphaned transactions
      const deleteRes = await client.query(`
        DELETE FROM customer_transactions 
        WHERE id IN (
          SELECT ct.id FROM customer_transactions ct
          LEFT JOIN customers c ON ct.customer_id = c.id
          WHERE c.id IS NULL
        )
      `);
      
      console.log(`🗑️  تم حذف ${deleteRes.rowCount} معاملة يتيمة\n`);
    } else {
      console.log('✅ لا توجد معاملات يتيمة\n');
    }
    
    // Check customer_transactions count
    const txCountRes = await client.query(`
      SELECT COUNT(*) as count FROM customer_transactions
    `);
    
    console.log(`📊 إجمالي المعاملات: ${txCountRes.rows[0].count}`);
    
    // Check customer_payments count
    const payCountRes = await client.query(`
      SELECT COUNT(*) as count FROM customer_payments
    `);
    
    console.log(`💳 إجمالي المدفوعات: ${payCountRes.rows[0].count}\n`);
    
    // Show summary statistics
    console.log('📈 ملخص قاعدة البيانات:\n');
    
    const tablesRes = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM stores) as stores,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM customer_transactions) as transactions,
        (SELECT COUNT(*) FROM customer_payments) as payments,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM products) as products
    `);
    
    const stats = tablesRes.rows[0];
    console.log(`👥 العملاء: ${stats.customers}`);
    console.log(`🏪 المتاجر: ${stats.stores}`);
    console.log(`👤 المستخدمون: ${stats.users}`);
    console.log(`📊 المعاملات: ${stats.transactions}`);
    console.log(`💳 المدفوعات: ${stats.payments}`);
    console.log(`📦 الطلبات: ${stats.orders}`);
    console.log(`📱 المنتجات: ${stats.products}\n`);
    
    console.log('✅ تم تنظيف قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDatabase().catch(console.error);
