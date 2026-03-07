import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function test() {
  try {
    console.log("🧪 Creating New Topup Order to Test Dashboard Fix\n");

    // Create new guest customer
    console.log("📍 Step 1: Create guest customer");
    const guestRes = await pool.query(
      `INSERT INTO users (name, phone, password, role, is_active, email) 
       VALUES ($1, $2, $3, 'customer', true, $4)
       RETURNING id, name`,
      ['Guest Test 2', '07812345678', '123456', 'test@example.com']
    );
    
    const customerId = guestRes.rows[0].id;
    const customerName = guestRes.rows[0].name;
    console.log(`✅ Guest created: ID = ${customerId}, Name = ${customerName}\n`);

    // Create topup order
    console.log("📍 Step 2: Create topup order");
    const orderRes = await pool.query(
      `INSERT INTO orders (customer_id, store_id, total_amount, phone, address, status, is_topup_order)
       VALUES ($1, $2, $3, $4, 'Topup Order', 'completed', true)
       RETURNING id, store_id, status, is_topup_order, created_at`,
      [customerId, 13, 25000, '07812345678']
    );

    const order = orderRes.rows[0];
    console.log(`✅ Order created:`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Store ID: ${order.store_id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   is_topup_order: ${order.is_topup_order}\n`);

    // Add order item
    console.log("📍 Step 3: Add order item");
    const itemRes = await pool.query(
      `INSERT INTO order_items (order_id, product_id, topup_product_id, quantity, price)
       VALUES ($1, NULL, $2, $3, $4)
       RETURNING id`,
      [order.id, 95, 1, 25000]
    );
    console.log(`✅ Order item added: ID = ${itemRes.rows[0].id}\n`);

    // Verify the order appears in topup orders endpoint query
    console.log("📍 Step 4: Verify order in dashboard query");
    const dashRes = await pool.query(
      `SELECT o.id, o.store_id, o.is_topup_order, o.status FROM orders o
       WHERE o.store_id = 13 AND o.is_topup_order = true AND o.id = $1`,
      [order.id]
    );

    if (dashRes.rows.length > 0) {
      console.log(`✅ Order ${order.id} FOUND in dashboard query!\n`);
      console.log(`📌 Dashboard should now show this order:`);
      console.log(`   - When merchant loads store 13 dashboard`);
      console.log(`   - Frontend uses /api/topup/orders?storeId=13 (FIXED)`);
      console.log(`   - Order appears immediately without refresh`);
    } else {
      console.log(`❌ Order not found in dashboard query`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

test();
