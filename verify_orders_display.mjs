import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkStoreOrders() {
  try {
    // Store 13 = علي الهادي (topup store)
    const res = await pool.query(`
      SELECT 
        id,
        store_id,
        is_topup_order,
        total_amount,
        status,
        created_at
      FROM orders 
      WHERE store_id = 13
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`\n📋 جميع الطلبات للمتجر 13 (علي الهادي):`);
    console.log(`الإجمالي: ${res.rows.length} طلب\n`);
    
    res.rows.forEach((order, i) => {
      console.log(`${i + 1}. Order ID: ${order.id}`);
      console.log(`   is_topup_order: ${order.is_topup_order}`);
      console.log(`   total_amount: ${order.total_amount}`);
      console.log(`   status: ${order.status}`);
      console.log(`   created_at: ${order.created_at}`);
      console.log('');
    });

    // Check what endpoint returns
    console.log('\n\n🔍 اختبار Endpoint `/api/orders?storeId=13`:\n');
    const response = await fetch('http://localhost:3000/api/orders?storeId=13');
    const data = await response.json();
    console.log(`عدد الطلبات المرجعة: ${data.length}`);
    data.slice(0, 3).forEach(order => {
      console.log(`- Order ${order.id}: is_topup_order=${order.is_topup_order}`);
    });

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkStoreOrders();
