import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkLatestOrders() {
  try {
    console.log('🔍 Latest Orders Analysis\n');
    
    // Get last 5 orders for customer 1
    const ordersRes = await dbPool.query(`
      SELECT 
        o.id,
        o.created_at,
        o.customer_id,
        o.total_amount,
        oi.topup_product_id,
        oi.price as item_price,
        tp.amount,
        tp.price as product_price,
        tp.retail_price,
        tp.wholesale_price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
      WHERE o.customer_id = 1 AND o.is_topup_order = true
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    if (ordersRes.rows.length === 0) {
      console.log('No orders found for customer 1');
      await dbPool.end();
      return;
    }
    
    console.log(`Total orders: ${ordersRes.rows.length}\n`);
    
    ordersRes.rows.forEach((order, idx) => {
      const timestamp = new Date(order.created_at).toLocaleTimeString('ar-IQ');
      console.log(`${idx + 1}. Order #${order.id} (${timestamp})`);
      console.log(`   Total Amount Sent: ${order.total_amount}`);
      console.log(`   Product ID: ${order.topup_product_id}`);
      console.log(`   Product Amount: ${order.amount}`);
      console.log(`   Product Price (base): ${order.product_price}`);
      console.log(`   Product Retail Price: ${order.retail_price}`);
      console.log(`   Product Wholesale Price: ${order.wholesale_price}`);
      
      // Analysis
      if (order.total_amount === order.retail_price) {
        console.log(`   ✅ CORRECT: Using retail price`);
      } else if (order.total_amount === order.wholesale_price) {
        console.log(`   ✅ OK: Using wholesale price (same as retail)`);
      } else if (order.total_amount === order.product_price) {
        console.log(`   ❌ WRONG: Using base product price instead of retail`);
      } else {
        console.log(`   ⚠️ UNKNOWN: Using unexpected price`);
      }
      console.log();
    });
    
    await dbPool.end();
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkLatestOrders();
