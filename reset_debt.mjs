import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function resetDebt() {
  try {
    console.log("🔄 Resetting customer 6 debt to 0...");
    
    const res = await pool.query(
      `UPDATE customers SET current_debt = 0 WHERE id = 6 RETURNING id, current_debt`
    );

    console.log("✅ Customer debt reset:");
    console.log(res.rows[0]);

    // Also delete any test orders
    console.log("\n🗑️  Deleting test orders...");
    const deleteRes = await pool.query(
      `DELETE FROM orders WHERE customer_id = 6 AND is_topup_order = true RETURNING id`
    );

    console.log(`✅ Deleted ${deleteRes.rows.length} test orders`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetDebt();
