import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن جميع العملاء...\n');
    
    // Get all customers
    const customersRes = await client.query(`
      SELECT id, name, phone, email, customer_type, credit_limit, created_at
      FROM customers 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 إجمالي العملاء: ${customersRes.rows.length}\n`);
    
    customersRes.rows.forEach((c, i) => {
      console.log(`${i+1}. ID: ${c.id} | Name: ${c.name} | Phone: ${c.phone} | Created: ${c.created_at}`);
    });
    
    // Get all transactions
    console.log('\n\n📋 جميع السجلات:\n');
    
    const txRes = await client.query(`
      SELECT id, customer_id, transaction_type, amount, description, created_at
      FROM customer_transactions 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 إجمالي السجلات: ${txRes.rows.length}\n`);
    
    if (txRes.rows.length > 0) {
      txRes.rows.forEach((t, i) => {
        console.log(`${i+1}. ID: ${t.id} | Customer ID: ${t.customer_id} | Type: ${t.transaction_type} | Amount: ${t.amount}`);
      });
      
      // Check for orphaned transactions
      console.log('\n\n⚠️  البحث عن السجلات اليتيمة (بدون عميل)...\n');
      
      const orphanRes = await client.query(`
        SELECT ct.id, ct.customer_id, ct.transaction_type, ct.amount
        FROM customer_transactions ct
        LEFT JOIN customers c ON ct.customer_id = c.id
        WHERE c.id IS NULL
      `);
      
      if (orphanRes.rows.length > 0) {
        console.log(`⚠️  وجدت ${orphanRes.rows.length} سجل يتيم:`);
        orphanRes.rows.forEach((t, i) => {
          console.log(`${i+1}. ID: ${t.id} | Customer ID: ${t.customer_id} (غير موجود!) | Amount: ${t.amount}`);
        });
      } else {
        console.log('✅ لا توجد سجلات يتيمة');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllData().catch(console.error);
