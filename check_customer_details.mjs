import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCustomerDetails() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري البحث عن تفاصيل العميل...\n');
    
    // Get customer details including all columns
    const customerRes = await client.query(`
      SELECT * FROM customers WHERE id = 6
    `);
    
    if (customerRes.rows.length === 0) {
      console.log('⚠️  لم يتم العثور على العميل');
      return;
    }
    
    const customer = customerRes.rows[0];
    
    console.log('👤 تفاصيل العميل:');
    console.log(`  ID: ${customer.id}`);
    console.log(`  Name: ${customer.name}`);
    console.log(`  Phone: ${customer.phone}`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Type: ${customer.customer_type}`);
    console.log(`  Credit Limit: ${customer.credit_limit}`);
    console.log(`  Current Debt: ${customer.current_debt}`);
    console.log(`  Starting Balance: ${customer.starting_balance}`);
    console.log(`  Created: ${customer.created_at}`);
    
    console.log('\n\n🔍 جميع أعمدة الجدول:');
    for (const [key, value] of Object.entries(customer)) {
      console.log(`  ${key}: ${value}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCustomerDetails().catch(console.error);
