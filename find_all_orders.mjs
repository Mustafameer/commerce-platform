import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function findOrder() {
  try {
    await client.connect();
    
    console.log('🔍 البحث عن الطلب 60 في جميع الجداول:\n');
    
    // Check orders table
    const inOrders = await client.query('SELECT COUNT(*) as cnt FROM orders WHERE id = 60 OR customer_id = 4');
    console.log(`📦 جدول orders: ${inOrders.rows[0].cnt} طلب`);
    
    // Check topup_orders table
    try {
      const inTopupOrders = await client.query('SELECT COUNT(*) as cnt FROM topup_orders WHERE customer_id = 4');
      console.log(`📦 جدول topup_orders: ${inTopupOrders.rows[0].cnt} طلب`);
    } catch (e) {
      console.log(`📦 جدول topup_orders: غير موجود`);
    }
    
    // Get all orders for customer 4
    console.log('\n📋 جميع الطلبات للعميل 4:');
    const allOrders = await client.query(`
      SELECT id, customer_id, topup_customer_id, total_amount 
      FROM orders 
      WHERE customer_id = 4 OR topup_customer_id = 4
      ORDER BY id DESC
    `);
    
    allOrders.rows.forEach(row => {
      console.log(`  ID: ${row.id}, customer_id: ${row.customer_id}, topup_customer_id: ${row.topup_customer_id}, المبلغ: ${row.total_amount}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.end();
  }
}

findOrder();
