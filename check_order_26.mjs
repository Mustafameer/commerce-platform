import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'commerce_db'
});

async function checkOrder26() {
  try {
    console.log('🔍 Checking Order 26 status...\n');

    const orderRes = await pool.query(
      'SELECT id, is_topup_order, store_id, total_amount FROM orders WHERE id = 26'
    );

    if (orderRes.rows.length > 0) {
      const order = orderRes.rows[0];
      console.log('Order:', order);
      console.log('\nis_topup_order:', order.is_topup_order);
    } else {
      console.log('Order not found');
    }

    const itemsRes = await pool.query(
      `SELECT order_id, product_id, topup_product_id, quantity, price 
       FROM order_items WHERE order_id = 26`
    );
    console.log('\nOrder items:');
    console.table(itemsRes.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder26();
