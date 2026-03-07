import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function checkPrices() {
  try {
    console.log("📊 Checking topup product prices...\n");

    const productsRes = await pool.query(
      `SELECT id, amount, price, retail_price, wholesale_price FROM topup_products ORDER BY id DESC LIMIT 3`
    );

    console.log("🛍️  Topup Products:");
    productsRes.rows.forEach(p => {
      console.log(`\n  ID ${p.id} - Amount: ${p.amount}`);
      console.log(`    - Price (old): ${p.price}`);
      console.log(`    - Retail Price (للجملة - reseller): ${p.retail_price}`);
      console.log(`    - Wholesale Price (للمفرد - cash): ${p.wholesale_price}`);
    });

    // Check orders with prices
    console.log("\n\n📦 Recent Orders with Item Prices:");
    const ordersRes = await pool.query(
      `SELECT o.id, o.total_amount, o.is_topup_order, 
              oi.price as item_price, oi.quantity, c.customer_type
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.is_topup_order = true
       ORDER BY o.id DESC LIMIT 5`
    );

    ordersRes.rows.forEach(row => {
      if (row.item_price) {
        const expectedPrice = row.total_amount / row.quantity;
        const match = Math.abs(row.item_price - expectedPrice) < 0.01 ? "✅" : "❌";
        console.log(`\n  Order ${row.id} (${row.customer_type})`);
        console.log(`    - Total: ${row.total_amount} | Qty: ${row.quantity}`);
        console.log(`    - Stored Price: ${row.item_price} | Expected: ${expectedPrice} ${match}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkPrices();
