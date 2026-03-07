import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function check() {
  try {
    const res = await pool.query(
      `SELECT id, current_debt, credit_limit FROM customers WHERE id = 6`
    );

    console.log("Customer 6 Debt Status:");
    console.log(res.rows[0]);

    // Check actual debt from orders
    const debtRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
       FROM orders
       WHERE customer_id = 6`
    );

    console.log("\nActual Debt from Orders:");
    console.log(debtRes.rows[0]);

    // Show all orders
    const ordersRes = await pool.query(
      `SELECT id, total_amount, status FROM orders WHERE customer_id = 6 ORDER BY id DESC LIMIT 5`
    );

    console.log("\nLast 5 Orders:");
    console.log(ordersRes.rows);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

check();
