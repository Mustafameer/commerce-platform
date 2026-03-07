const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkSchema() {
  try {
    await client.connect();

    console.log("\n📋 TOPUP_PRODUCTS Table Schema:\n");

    // Get columns for topup_products
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_products'
      ORDER BY ordinal_position
    `);

    console.log("Columns:");
    columnsResult.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    });

    // Get all data from topup_products
    console.log("\n🎟️ All Topup Products:\n");
    const result = await client.query(`SELECT * FROM topup_products`);
    
    result.rows.forEach((p, idx) => {
      console.log(`${idx + 1}. ${JSON.stringify(p)}`);
    });

    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkSchema();
