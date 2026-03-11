import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupDeletedTransactions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري التحقق من السجلات المحذوفة...');
    
    // Get all payments
    const paymentsRes = await client.query(
      'SELECT id, customer_id, amount, created_at FROM customer_payments ORDER BY created_at DESC'
    );
    
    console.log(`\n📊 إجمالي السجلات الموجودة: ${paymentsRes.rows.length}`);
    console.log('\n📋 السجلات الموجودة:');
    paymentsRes.rows.forEach(p => {
      console.log(`  ID: ${p.id}, Customer: ${p.customer_id}, Amount: ${p.amount}, Date: ${p.created_at}`);
    });
    
    // Check for orphaned payments (payments with non-existent customer_id)
    console.log('\n\n🔎 جاري البحث عن السجلات اليتيمة (بدون عميل)...');
    const orphanedRes = await client.query(`
      SELECT cp.id, cp.customer_id, cp.amount, cp.created_at 
      FROM customer_payments cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (orphanedRes.rows.length > 0) {
      console.log(`\n⚠️  وجدت ${orphanedRes.rows.length} سجل يتيم:`);
      orphanedRes.rows.forEach(p => {
        console.log(`  ID: ${p.id}, Customer ID: ${p.customer_id}, Amount: ${p.amount}`);
      });
      
      // Delete orphaned payments
      console.log('\n🗑️  جاري حذف السجلات اليتيمة...');
      const deleteRes = await client.query(
        `DELETE FROM customer_payments 
         WHERE id IN (
           SELECT cp.id FROM customer_payments cp
           LEFT JOIN customers c ON cp.customer_id = c.id
           WHERE c.id IS NULL
         )`
      );
      
      console.log(`✅ تم حذف ${deleteRes.rowCount} سجل يتيم`);
    } else {
      console.log('✅ لا توجد سجلات يتيمة');
    }
    
    // Get final count
    const finalRes = await client.query(
      'SELECT COUNT(*) as count FROM customer_payments'
    );
    
    console.log(`\n\n📊 الإجمالي النهائي: ${finalRes.rows[0].count} سجل`);
    
    // Show remaining payments
    const finalPaymentsRes = await client.query(
      'SELECT id, customer_id, amount, created_at FROM customer_payments ORDER BY created_at DESC'
    );
    
    console.log('\n📋 السجلات المتبقية:');
    finalPaymentsRes.rows.forEach(p => {
      console.log(`  ID: ${p.id}, Customer: ${p.customer_id}, Amount: ${p.amount}, Date: ${p.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDeletedTransactions().catch(console.error);
