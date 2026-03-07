const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkStructure() {
  try {
    await client.connect();

    console.log("\n📋 Topup Products Table Structure:\n");

    // Get columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topup_products'
      ORDER BY ordinal_position
    `);

    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n🔍 All topup_products:');
    const allResult = await client.query(`SELECT * FROM topup_products`);
    
    allResult.rows.forEach((p, idx) => {
      console.log(`\n${idx + 1}. ID: ${p.id}`);
      Object.entries(p).forEach(([key, value]) => {
        if (key !== 'id') {
          console.log(`   ${key}: ${value}`);
        }
      });
    });

    await client.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkStructure();
