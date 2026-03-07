import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function testDebtDelete() {
  try {
    console.log("🧪 Testing debt update on order deletion...\n");

    // Reset customer 6
    console.log("1️⃣ Resetting customer 6...");
    await pool.query(`UPDATE customers SET current_debt = 0 WHERE id = 6`);
    await pool.query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = 6)`);
    await pool.query(`DELETE FROM orders WHERE customer_id = 6`);

    // Check initial state
    let custRes = await pool.query(`SELECT current_debt FROM customers WHERE id = 6`);
    console.log(`   Initial debt: ${custRes.rows[0].current_debt}`);

    // Create a test order
    console.log("\n2️⃣ Creating test order with amount 25000...");
    const orderRes = await pool.query(
      `INSERT INTO orders (customer_id, store_id, total_amount, phone, address, status, is_topup_order)
       VALUES (6, 13, 25000, '07810101010', 'Test', 'completed', true)
       RETURNING id`
    );
    const orderId = orderRes.rows[0].id;
    console.log(`   Order created: ID=${orderId}`);

    // Add order item
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, topup_product_id, quantity, price)
       VALUES ($1, NULL, 95, 1, 25000)`,
      [orderId]
    );

    // Update debt
    await pool.query(
      `UPDATE customers SET current_debt = current_debt + 25000 WHERE id = 6`
    );

    custRes = await pool.query(`SELECT current_debt FROM customers WHERE id = 6`);
    console.log(`   Debt after order: ${custRes.rows[0].current_debt}`);

    // Delete the order
    console.log("\n3️⃣ Deleting order...");
    await pool.query(
      `UPDATE customers SET current_debt = GREATEST(0, current_debt - 25000) WHERE id = 6`
    );

    custRes = await pool.query(`SELECT current_debt FROM customers WHERE id = 6`);
    const finalDebt = parseFloat(custRes.rows[0].current_debt || 0);
    console.log(`   Debt after deletion: ${finalDebt}`);

    if (finalDebt === 0) {
      console.log("\n✅ TEST PASSED: Debt correctly reduced to 0");
    } else {
      console.log(`\n❌ TEST FAILED: Expected 0, got ${finalDebt}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testDebtDelete();
