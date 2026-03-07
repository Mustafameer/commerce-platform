import pool from 'pg';
const { Pool } = pool;

const dbPool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkOrders() {
  try {
    console.log('🔍 Checking Last Orders for Customer 1\n');
    
    const ordersRes = await dbPool.query(`
      SELECT 
        o.id as order_id,
        o.customer_id,
        o.total_amount,
        oi.topup_product_id,
        oi.price,
        tp.amount,
        tp.price as product_price,
        tp.retail_price as product_retail,
        tp.wholesale_price as product_wholesale,
        o.is_topup_order
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
      WHERE o.customer_id = 1 AND o.is_topup_order = true
      ORDER BY o.id DESC
      LIMIT 10
    `);
    
    console.log(`Total topup orders for customer 1: ${ordersRes.rowCount}\n`);
    
    ordersRes.rows.forEach((row, idx) => {
      console.log(`Order ${idx + 1}:`);
      console.log(`  - Order ID: ${row.order_id}`);
      console.log(`  - Total Amount: ${row.total_amount}`);
      console.log(`  - Topup Product ID: ${row.topup_product_id}`);
      console.log(`  - Order Item Price: ${row.price}`);
      console.log(`  - Product Amount: ${row.amount}`);
      console.log(`  - Product Retail Price: ${row.product_retail}`);
      console.log(`  - Product Wholesale Price: ${row.product_wholesale}\n`);
    });
    
    await dbPool.end();
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkOrders();
