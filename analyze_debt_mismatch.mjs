import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function checkAll() {
  try {
    console.log("📊 FULL DEBT ANALYSIS\n");

    // Get all customers
    const customersRes = await pool.query(
      `SELECT id, phone, name, credit_limit, current_debt, customer_type FROM customers ORDER BY ID`
    );

    console.log("👥 ALL CUSTOMERS:");
    customersRes.rows.forEach(c => {
      console.log(`\n  ID ${c.id}: ${c.name} (${c.phone})`);
      console.log(`    - Type: ${c.customer_type}`);
      console.log(`    - Credit Limit: ${c.credit_limit}`);
      console.log(`    - Stored Debt: ${c.current_debt}`);
    });

    // Calculate actual debt for each customer
    console.log("\n\n💰 ACTUAL DEBT FROM ORDERS:");
    for (const customer of customersRes.rows) {
      const debtRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount - COALESCE(discount_amount, 0)), 0) as total_debt
         FROM orders
         WHERE customer_id = $1`,
        [customer.id]
      );

      const actualDebt = parseFloat(debtRes.rows[0].total_debt || 0);
      const availableCredit = customer.credit_limit - actualDebt;
      const storedDebt = parseFloat(customer.current_debt || 0);
      const debtMismatch = actualDebt !== storedDebt ? "⚠️ MISMATCH!" : "✅";

      console.log(`\n  Customer ID ${customer.id}: ${customer.name}`);
      console.log(`    - Calculated Debt (from orders): ${actualDebt}`);
      console.log(`    - Stored Debt (current_debt): ${storedDebt} ${debtMismatch}`);
      console.log(`    - Available Credit: ${availableCredit}`);

      if (debtMismatch === "⚠️ MISMATCH!") {
        console.log(`    - NEED TO UPDATE: should be ${actualDebt}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAll();
