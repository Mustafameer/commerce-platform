import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن الجداول...\n');
    
    // Get all tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 الجداول الموجودة (${tablesRes.rows.length}):`);
    tablesRes.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });
    
    // Check customer_payments table structure if exists
    const paymentTableRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'customer_payments'
      )
    `);
    
    if (paymentTableRes.rows[0].exists) {
      console.log('\n✅ جدول customer_payments موجود');
      
      // Get column info
      const columnsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'customer_payments'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 أعمدة الجدول:');
      columnsRes.rows.forEach(c => {
        console.log(`  - ${c.column_name}: ${c.data_type}`);
      });
      
      // Get record count
      const countRes = await client.query('SELECT COUNT(*) as count FROM customer_payments');
      console.log(`\n📊 عدد السجلات: ${countRes.rows[0].count}`);
      
      // Show first 5 records
      const recordsRes = await client.query(`
        SELECT id, customer_id, amount, created_at 
        FROM customer_payments 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 أول 5 سجلات:');
      recordsRes.rows.forEach(r => {
        console.log(`  ID: ${r.id}, Customer: ${r.customer_id}, Amount: ${r.amount}, Date: ${r.created_at}`);
      });
    } else {
      console.log('\n⚠️  جدول customer_payments غير موجود');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listTables().catch(console.error);
