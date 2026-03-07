import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function syncDebts() {
  try {
    console.log("🔄 Synchronizing all customer debts with actual orders...\n");

    // Get all customers
    const customersRes = await pool.query(
      `SELECT id FROM customers ORDER BY id`
    );

    let fixed = 0;

    for (const customer of customersRes.rows) {
      // Calculate actual debt
      const debtRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
         FROM orders
         WHERE customer_id = $1`,
        [customer.id]
      );

      const actualDebt = parseFloat(debtRes.rows[0].total_debt || 0);

      // Update the stored debt
      await pool.query(
        `UPDATE customers SET current_debt = $1 WHERE id = $2`,
        [actualDebt, customer.id]
      );

      console.log(`✅ Customer ${customer.id}: debt set to ${actualDebt}`);
      fixed++;
    }

    console.log(`\n✅ SYNC COMPLETE: Fixed ${fixed} customers\n`);

    // Show final state
    const finalRes = await pool.query(
      `SELECT id, phone, name, credit_limit, current_debt FROM customers ORDER BY id`
    );

    console.log("📊 Final State:");
    finalRes.rows.forEach(c => {
      const available = c.credit_limit - c.current_debt;
      console.log(`  Customer ${c.id}: ${c.name}`);
      console.log(`    - Limit: ${c.credit_limit} | Debt: ${c.current_debt} | Available: ${available}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

syncDebts();
