import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAndCheckPaymentsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري التحقق من جدول customer_payments...\n');
    
    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ جدول customer_payments موجود أو تم إنشاؤه\n');
    
    // Check for records
    const countRes = await client.query('SELECT COUNT(*) as count FROM customer_payments');
    const count = countRes.rows[0].count;
    
    console.log(`📊 عدد السجلات: ${count}\n`);
    
    if (count > 0) {
      console.log('📋 السجلات الموجودة:');
      const recordsRes = await client.query(`
        SELECT id, customer_id, amount, created_at 
        FROM customer_payments 
        ORDER BY created_at DESC
      `);
      
      recordsRes.rows.forEach((r, i) => {
        console.log(`\n${i+1}. ID: ${r.id}`);
        console.log(`   Customer: ${r.customer_id}`);
        console.log(`   Amount: ${r.amount}`);
        console.log(`   Date: ${r.created_at}`);
      });
    } else {
      console.log('✅ لا توجد سجلات في جدول customer_payments');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAndCheckPaymentsTable().catch(console.error);
