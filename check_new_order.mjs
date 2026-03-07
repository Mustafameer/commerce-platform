import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkLatestOrders() {
  try {
    console.log('📋 جميع الطلبات للمتجر 13 (آخر 10):\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        store_id,
        is_topup_order,
        total_amount,
        status,
        phone,
        created_at
      FROM orders 
      WHERE store_id = 13
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`الإجمالي: ${result.rows.length} طلب\n`);
    result.rows.forEach((order, i) => {
      console.log(`${i + 1}. Order ID: ${order.id} | Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log(`   is_topup_order: ${order.is_topup_order} | Amount: ${order.total_amount} | Status: ${order.status}`);
      console.log(`   Phone: ${order.phone}`);
      console.log('');
    });

    // Check order items
    console.log('\n\n📦 تفاصيل الطلبات:\n');
    const itemsResult = await pool.query(`
      SELECT 
        oi.order_id,
        oi.product_id,
        oi.topup_product_id,
        oi.quantity,
        oi.price
      FROM order_items oi
      WHERE oi.order_id IN (SELECT id FROM orders WHERE store_id = 13)
      ORDER BY oi.order_id DESC
      LIMIT 20
    `);
    
    console.table(itemsResult.rows);
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkLatestOrders();
