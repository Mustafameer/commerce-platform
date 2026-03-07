import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function test() {
  try {
    console.log("🧪 Testing Database for Order 35\n");

    // Check the database directly
    const result = await pool.query(
      `SELECT id, store_id, status, is_topup_order FROM orders WHERE id = 35`
    );

    if (result.rows.length > 0) {
      const order = result.rows[0];
      console.log("✅ Order 35 found in database:");
      console.log(`   store_id: ${order.store_id}`);
      console.log(`   status: ${order.status}`);
      console.log(`   is_topup_order: ${order.is_topup_order}`);
      console.log(`\nℹ️ Frontend should now fetch from /api/topup/orders?storeId=13`);
      console.log(`and the order will appear in the merchant dashboard.`);
    } else {
      console.log("❌ Order 35 not found in database");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

test();
