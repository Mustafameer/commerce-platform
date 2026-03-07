import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'commerce_db'
});

async function fixOrder26() {
  try {
    console.log('🔧 Fixing Order 26...\n');

    // Step 1: Update order to mark as topup
    console.log('📍 Step 1: Marking Order 26 as topup order');
    await pool.query(
      'UPDATE orders SET is_topup_order = true WHERE id = 26'
    );
    console.log('✅ Updated is_topup_order to true\n');

    // Step 2: Fix order_items to use topup_product_id instead of product_id
    console.log('📍 Step 2: Fixing order_items structure');
    await pool.query(
      `UPDATE order_items 
       SET topup_product_id = product_id, product_id = NULL 
       WHERE order_id = 26 AND product_id = 95`
    );
    console.log('✅ Fixed order_items: product_id → topup_product_id\n');

    // Step 3: Verify the changes
    console.log('📍 Step 3: Verifying changes\n');
    
    const orderRes = await pool.query(
      'SELECT id, is_topup_order, store_id, total_amount FROM orders WHERE id = 26'
    );
    console.log('Order:', orderRes.rows[0]);

    const itemsRes = await pool.query(
      `SELECT order_id, product_id, topup_product_id, quantity, price 
       FROM order_items WHERE order_id = 26`
    );
    console.log('\nOrder items:');
    console.table(itemsRes.rows);

    console.log('\n✅ Order 26 fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixOrder26();
