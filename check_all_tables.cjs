const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkTables() {
  try {
    await client.connect();

    console.log("\n📊 Checking all tables...\n");

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("Available tables:");
    tablesResult.rows.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.table_name}`);
    });

    // Check for product-related tables
    const productTables = tablesResult.rows.filter(t => 
      t.table_name.includes('product') || 
      t.table_name.includes('item') ||
      t.table_name.includes('topup')
    );

    console.log("\n📦 Product-related tables found:");
    productTables.forEach(t => {
      console.log(`\n   Table: ${t.table_name}`);
    });

    // Check row counts
    console.log("\n📈 Row counts for each table:");
    for (const table of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   ${table.table_name}: ${countResult.rows[0].count} rows`);
    }

    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTables();
