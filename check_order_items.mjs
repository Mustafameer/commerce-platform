import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkOrderDetails() {
  try {
    // Get order items for store 13's recent orders
    const itemsRes = await pool.query(
      `SELECT 
        oi.order_id,
        oi.product_id,
        oi.topup_product_id,
        oi.quantity,
        oi.price,
        o.status,
        o.is_topup_order,
        o.total_amount
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = 13
      ORDER BY oi.order_id DESC`
    );
    
    console.log('📦 Order Items for Store 13:\n');
    itemsRes.rows.forEach(item => {
      console.log(`Order ID: ${item.order_id}`);
      console.log(`  Product ID: ${item.product_id}`);
      console.log(`  Topup Product ID: ${item.topup_product_id}`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Order Total: ${item.total_amount}`);
      console.log(`  Order Status: ${item.status}`);
      console.log(`  Is Topup Order: ${item.is_topup_order}`);
      console.log('  ---');
    });

    // Check if there are actually topup_products in the system
    console.log('\n\n🛍️  Available Topup Products:\n');
    const productsRes = await pool.query(
      `SELECT id, store_id, company_name, amount, price FROM topup_products LIMIT 10`
    );
    console.table(productsRes.rows);

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkOrderDetails();
