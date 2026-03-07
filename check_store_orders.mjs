import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkStoreOrders() {
  try {
    // 1. Find store by name
    console.log('🔍 Looking for store "علي الهادي"...\n');
    const storeRes = await pool.query(
      `SELECT id, store_name, owner_name, store_type FROM stores WHERE store_name ILIKE $1`,
      ['%علي الهادي%']
    );
    
    if (storeRes.rows.length === 0) {
      console.log('❌ Store not found!');
      console.log('\n📌 All stores:');
      const allStores = await pool.query('SELECT id, store_name, owner_name, store_type FROM stores ORDER BY id DESC LIMIT 10');
      console.table(allStores.rows);
      pool.end();
      return;
    }
    
    const store = storeRes.rows[0];
    console.log(`✅ Found Store: "${store.store_name}" (ID: ${store.id})`);
    console.log(`   Owner: ${store.owner_name}`);
    console.log(`   Type: ${store.store_type}\n`);
    
    // 2. Get all orders for this store
    console.log(`📋 Fetching all orders for store ID ${store.id}...\n`);
    const ordersRes = await pool.query(
      `SELECT 
        id,
        customer_id,
        total_amount,
        status,
        is_topup_order,
        created_at,
        phone,
        address
      FROM orders 
      WHERE store_id = $1 
      ORDER BY created_at DESC`,
      [store.id]
    );
    
    console.log(`Found ${ordersRes.rows.length} total orders for this store:\n`);
    ordersRes.rows.forEach(order => {
      console.log(`Order ID: ${order.id}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: ${order.total_amount}`);
      console.log(`  Is Topup: ${order.is_topup_order}`);
      console.log(`  Phone: ${order.phone}`);
      console.log(`  Created: ${order.created_at}`);
      console.log('  ---');
    });
    
    if (ordersRes.rows.length > 0) {
      // Check order items
      console.log('\n📦 Order Items Details:\n');
      const itemsRes = await pool.query(
        `SELECT 
          oi.order_id,
          oi.product_id,
          oi.topup_product_id,
          oi.quantity,
          oi.price,
          p.name as product_name,
          tp.company_name as topup_company
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN topup_products tp ON oi.topup_product_id = tp.id
        WHERE oi.order_id IN (
          SELECT id FROM orders WHERE store_id = $1
        )
        ORDER BY oi.order_id DESC`,
        [store.id]
      );
      
      console.table(itemsRes.rows);
    }
    
    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkStoreOrders();
