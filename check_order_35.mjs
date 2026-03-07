import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function checkOrder35() {
  try {
    console.log("🔍 Checking Order 35 in database...\n");

    // Check order itself
    console.log("📍 Order Details:");
    const orderRes = await pool.query(
      `SELECT * FROM orders WHERE id = 35`
    );
    
    if (orderRes.rows.length === 0) {
      console.log("❌ Order 35 not found!");
      return;
    }

    const order = orderRes.rows[0];
    console.log(JSON.stringify(order, null, 2));

    // Check order items
    console.log("\n📍 Order Items:");
    const itemsRes = await pool.query(
      `SELECT * FROM order_items WHERE order_id = 35`
    );
    console.log(JSON.stringify(itemsRes.rows, null, 2));

    // Check if order should appear in dashboard
    console.log("\n📍 Dashboard Query Test:");
    const dashboardRes = await pool.query(
      `SELECT 
        o.id, 
        o.store_id, 
        o.customer_id, 
        o.total_amount,
        o.status, 
        o.created_at, 
        o.phone,
        o.is_topup_order
      FROM orders o
      WHERE o.store_id = 13 AND o.is_topup_order = true
      ORDER BY o.created_at DESC`
    );

    if (dashboardRes.rows.find(o => o.id === 35)) {
      console.log("✅ Order 35 FOUND in dashboard query for store 13!");
    } else {
      console.log("❌ Order 35 NOT FOUND in dashboard query for store 13");
      console.log("\nOrders returned for store 13:");
      console.log(dashboardRes.rows.map(o => ({ id: o.id, is_topup_order: o.is_topup_order, store_id: o.store_id })));
    }

    // Check customer
    console.log("\n📍 Customer Details:");
    const customerRes = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [order.customer_id]
    );
    console.log(JSON.stringify(customerRes.rows[0], null, 2));

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkOrder35();
