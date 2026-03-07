import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function debugOrder() {
  try {
    console.log('🔍 تحليل الطلب الجديد 26:\n');
    
    // Get order 26 details
    const orderRes = await pool.query(`
      SELECT * FROM orders WHERE id = 26
    `);
    
    const order = orderRes.rows[0];
    console.log('Order Details:');
    console.log(JSON.stringify(order, null, 2));
    
    // Get items for this order
    const itemsRes = await pool.query(`
      SELECT * FROM order_items WHERE order_id = 26
    `);
    
    console.log('\n\nOrder Items:');
    console.table(itemsRes.rows);
    
    // Get the product details
    console.log('\n\nProduct Details:');
    const productRes = await pool.query(`
      SELECT id, name, store_id FROM products WHERE id = 95
    `);
    
    console.log(JSON.stringify(productRes.rows[0], null, 2));
    
    // Check stores table
    console.log('\n\nStore Details:');
    const storesRes = await pool.query(`
      SELECT id, store_name, store_type FROM stores WHERE id = 13
    `);
    
    console.log(JSON.stringify(storesRes.rows[0], null, 2));
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

debugOrder();
