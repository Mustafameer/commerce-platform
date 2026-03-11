import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addStartingBalanceColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري فحص جدول customers...\n');
    
    // Check if starting_balance column exists
    const checkRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'starting_balance'
      )
    `);
    
    if (checkRes.rows[0].exists) {
      console.log('✅ عمود starting_balance موجود بالفعل');
      return;
    }
    
    console.log('⚠️  عمود starting_balance غير موجود، جاري الإضافة...\n');
    
    // Add the column
    await client.query(`
      ALTER TABLE customers 
      ADD COLUMN starting_balance NUMERIC DEFAULT 0
    `);
    
    console.log('✅ تم إضافة عمود starting_balance\n');
    
    // Set default value to 0 for all existing customers
    await client.query(`
      UPDATE customers SET starting_balance = 0 WHERE starting_balance IS NULL
    `);
    
    console.log('✅ تم تعيين القيم الافتراضية\n');
    
    // Verify
    const finalRes = await client.query(`
      SELECT id, name, starting_balance FROM customers
    `);
    
    console.log('📊 العملاء بعد التحديث:');
    finalRes.rows.forEach(c => {
      console.log(`  ID: ${c.id} | Name: ${c.name} | Starting Balance: ${c.starting_balance}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addStartingBalanceColumn().catch(console.error);
