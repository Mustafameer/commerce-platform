import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123",
  database: "multi_ecommerce",
  port: 5432,
});

async function fixFK() {
  try {
    console.log("🔧 Fixing foreign key constraint...\n");

    // Drop the old foreign key
    console.log("1️⃣  Dropping old foreign key: orders_customer_id_fkey");
    try {
      await pool.query(
        `ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey`
      );
      console.log("   ✅ Dropped successfully");
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`);
    }

    // Add the new foreign key pointing to customers
    console.log("\n2️⃣  Adding new foreign key: orders -> customers");
    await pool.query(
      `ALTER TABLE orders 
       ADD CONSTRAINT orders_customer_id_fkey 
       FOREIGN KEY (customer_id) 
       REFERENCES customers(id) 
       ON DELETE SET NULL`
    );
    console.log("   ✅ Added successfully");

    // Verify the new foreign key
    console.log("\n3️⃣  Verifying foreign keys...");
    const fkRes = await pool.query(
      `SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu ON (tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema)
       JOIN information_schema.constraint_column_usage AS ccu ON (ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema)
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'orders'`
    );
    
    fkRes.rows.forEach(row => {
      console.log(`   ✅ ${row.constraint_name}: ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Try INSERT again
    console.log("\n4️⃣  Testing INSERT with new foreign key...");
    try {
      const insertRes = await pool.query(
        `INSERT INTO orders (customer_id, store_id, total_amount, phone, address, status, is_topup_order)
         VALUES (6, 13, 40000, '07810101010', 'Test', 'completed', true)
         RETURNING id`,
      );
      console.log(`   ✅ INSERT succeeded! Order ID: ${insertRes.rows[0].id}`);
      
      // Clean up that test order
      await pool.query(`DELETE FROM orders WHERE id = $1`, [insertRes.rows[0].id]);
      console.log(`   ✅ Test order deleted`);
    } catch (err) {
      console.log(`   ❌ INSERT failed: ${err.message}`);
    }

    console.log("\n✅ FOREIGN KEY FIX COMPLETED\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixFK();
