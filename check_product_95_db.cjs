const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkProduct95() {
  try {
    await client.connect();

    console.log("\n🔍 Checking Product 95...\n");

    // Direct query
    const result = await client.query(
      `SELECT 
        products.id,
        products.name,
        products.price,
        products.store_id,
        products.category_id,
        stores.store_name,
        categories.name as category_name
      FROM products 
      LEFT JOIN stores ON products.store_id = stores.id
      LEFT JOIN categories ON products.category_id = categories.id
      WHERE products.id = 95`
    );

    console.log("Result:", JSON.stringify(result.rows, null, 2));

    if (result.rows.length === 0) {
      console.log('\n❌ Product 95 NOT FOUND!\n');
    } else {
      console.log('\n✅ Product 95 found\n');
    }

    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkProduct95();
