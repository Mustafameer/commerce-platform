import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTransactions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن السجلات...\n');
    
    // Check columns in customer_transactions
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 أعمدة جدول customer_transactions:');
    columnsRes.rows.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
    
    // Get all transactions
    console.log('\n\n🔍 جاري البحث عن جميع السجلات...\n');
    const allRes = await client.query(`
      SELECT * FROM customer_transactions 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 إجمالي السجلات: ${allRes.rows.length}\n`);
    
    if (allRes.rows.length > 0) {
      console.log('📋 السجلات الموجودة:');
      allRes.rows.forEach((r, i) => {
        console.log(`\n${i+1}. ID: ${r.id}`);
        console.log(`   Customer: ${r.customer_id}`);
        console.log(`   Type: ${r.transaction_type}`);
        console.log(`   Amount: ${r.amount}`);
        console.log(`   Description: ${r.description}`);
        console.log(`   Date: ${r.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTransactions().catch(console.error);
