import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function cleanupAndFix() {
  try {
    console.log("🧹 Cleaning up invalid orders...\n");

    // Find orders with invalid customer_id
    console.log("1️⃣  Finding orders with invalid customers...");
    const invalidRes = await pool.query(
      `SELECT DISTINCT customer_id FROM orders 
       WHERE customer_id IS NOT NULL 
       AND customer_id NOT IN (SELECT id FROM customers)`
    );

    console.log(`   Found ${invalidRes.rows.length} invalid customer IDs:`);
    invalidRes.rows.forEach(row => {
      console.log(`   - customer_id: ${row.customer_id}`);
    });

    // Delete orders with invalid customer_id
    if (invalidRes.rows.length > 0) {
      console.log("\n2️⃣  Deleting orders with invalid customers...");
      const deleteRes = await pool.query(
        `DELETE FROM orders 
         WHERE customer_id IS NOT NULL 
         AND customer_id NOT IN (SELECT id FROM customers)`
      );
      console.log(`   ✅ Deleted ${deleteRes.rowCount} orders`);
    }

    // Now add the correct foreign key
    console.log("\n3️⃣  Adding correct foreign key...");
    try {
      await pool.query(
        `ALTER TABLE orders 
         ADD CONSTRAINT orders_customer_id_fkey 
         FOREIGN KEY (customer_id) 
         REFERENCES customers(id) 
         ON DELETE SET NULL`
      );
      console.log("   ✅ Foreign key added successfully");
    } catch (err) {
      if (err.code === '42710') {
        console.log("   ℹ️  Foreign key already exists (or creating duplicate)");
      } else {
        throw err;
      }
    }

    console.log("\n✅ CLEANUP AND FIX COMPLETED\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanupAndFix();
