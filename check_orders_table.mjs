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
    console.log("Checking orders table structure...\n");

    // Check table structure
    const tableRes = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'orders' 
       ORDER BY ordinal_position`
    );

    console.log("📋 ORDERS Table Columns:");
    tableRes.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (NULL: ${row.is_nullable})`);
    });

    // Check foreign keys
    const fkRes = await pool.query(
      `SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu ON (tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema)
       JOIN information_schema.constraint_column_usage AS ccu ON (ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema)
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'orders'`
    );

    console.log("\n🔗 FOREIGN KEYS on orders:");
    fkRes.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Check if customer exists
    console.log("\n👤 Checking customer 6:");
    const custRes = await pool.query(
      `SELECT id, store_id FROM customers WHERE id = 6`
    );
    console.log(`  - Customer exists: ${custRes.rows.length > 0}`);
    if (custRes.rows.length > 0) {
      console.log(`  - Data: ${JSON.stringify(custRes.rows[0])}`);
    }

    // Try INSERT
    console.log("\n✅ Attempting INSERT...");
    try {
      const insertRes = await pool.query(
        `INSERT INTO orders (customer_id, store_id, total_amount, phone, address, status, is_topup_order)
         VALUES (6, 13, 40000, '07810101010', 'Test', 'completed', true)
         RETURNING id`,
      );
      console.log(`✅ INSERT succeeded: ID=${insertRes.rows[0].id}`);
    } catch (err) {
      console.log(`❌ INSERT failed: ${err.message}`);
      console.log(`   Code: ${err.code}`);
      console.log(`   Detail: ${err.detail}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

check();
