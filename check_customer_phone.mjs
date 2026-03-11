import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCustomersAndTransactions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن العملاء برقم الهاتف 07810909577...\n');
    
    // Find customers with this phone number
    const customersRes = await client.query(`
      SELECT id, name, phone, email, customer_type, credit_limit, created_at
      FROM customers 
      WHERE phone = '07810909577'
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 عدد العملاء: ${customersRes.rows.length}\n`);
    
    customersRes.rows.forEach((c, i) => {
      console.log(`${i+1}. ID: ${c.id} | Name: ${c.name} | Created: ${c.created_at}`);
      console.log(`   Phone: ${c.phone} | Type: ${c.customer_type} | Credit Limit: ${c.credit_limit}`);
    });
    
    if (customersRes.rows.length === 0) {
      console.log('⚠️  لا توجد عملاء بهذا الرقم');
      return;
    }
    
    // For each customer, check their transactions
    console.log('\n\n📋 السجلات المرتبطة بكل عميل:\n');
    
    for (const customer of customersRes.rows) {
      const txRes = await client.query(`
        SELECT id, transaction_type, amount, description, created_at
        FROM customer_transactions 
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `, [customer.id]);
      
      console.log(`\n👤 العميل ID: ${customer.id} (${customer.name})`);
      console.log(`   السجلات: ${txRes.rows.length}`);
      
      if (txRes.rows.length > 0) {
        txRes.rows.forEach((t, i) => {
          console.log(`   ${i+1}. Type: ${t.transaction_type} | Amount: ${t.amount} | Date: ${t.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCustomersAndTransactions().catch(console.error);
