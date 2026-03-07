import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function resetAndTest() {
  try {
    console.log("🔄 Resetting customer 6 debt...\n");

    // Reset customer 6
    await pool.query(
      `UPDATE customers SET current_debt = 0 WHERE id = 6`
    );

    // Delete all topup orders
    await pool.query(
      `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_topup_order = true)`
    );
    await pool.query(
      `DELETE FROM orders WHERE is_topup_order = true`
    );

    console.log("✅ Reset complete\n");

    // Check current state
    const res = await pool.query(
      `SELECT id, phone, name, credit_limit, current_debt FROM customers WHERE id = 6`
    );

    console.log("📊 Customer 6 Before Purchase:");
    console.log(`  - Phone: ${res.rows[0].phone}`);
    console.log(`  - Name: ${res.rows[0].name}`);
    console.log(`  - Credit Limit: ${res.rows[0].credit_limit}`);
    console.log(`  - Current Debt: ${res.rows[0].current_debt}`);
    console.log(`  - Available: ${res.rows[0].credit_limit - res.rows[0].current_debt}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetAndTest();
