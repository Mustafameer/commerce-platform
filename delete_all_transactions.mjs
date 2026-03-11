import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteAllTransactions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن السجلات قبل الحذف...\n');
    
    // Get all transactions for customer 6 (Mustafa)
    const beforeRes = await client.query(`
      SELECT id, customer_id, customer_id, transaction_type, amount, description, created_at
      FROM customer_transactions 
      WHERE customer_id = 6
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 السجلات الموجودة للعميل (${beforeRes.rows.length}):`);
    beforeRes.rows.forEach((r, i) => {
      console.log(`${i+1}. ID: ${r.id} | Type: ${r.transaction_type} | Amount: ${r.amount} | Date: ${r.created_at}`);
    });
    
    if (beforeRes.rows.length === 0) {
      console.log('✅ لا توجد سجلات للحذف');
      return;
    }
    
    // Delete all customer transactions for customer 6
    console.log('\n🗑️  جاري حذف جميع السجلات...\n');
    
    const deleteRes = await client.query(
      'DELETE FROM customer_transactions WHERE customer_id = $1',
      [6]
    );
    
    console.log(`✅ تم حذف ${deleteRes.rowCount} سجل\n`);
    
    // Verify deletion
    console.log('🔍 جاري التحقق من الحذف...\n');
    
    const afterRes = await client.query(`
      SELECT COUNT(*) as count FROM customer_transactions WHERE customer_id = 6
    `);
    
    console.log(`📊 السجلات المتبقية للعميل: ${afterRes.rows[0].count}`);
    
    if (afterRes.rows[0].count === 0) {
      console.log('✅ تم حذف جميع السجلات بنجاح!');
    }
    
    // Show total transactions in database
    const totalRes = await client.query(
      'SELECT COUNT(*) as count FROM customer_transactions'
    );
    
    console.log(`\n📈 إجمالي المعاملات في قاعدة البيانات: ${totalRes.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAllTransactions().catch(console.error);
