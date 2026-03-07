const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkProducts() {
  try {
    await client.connect();

    console.log("\n📦 Available Products (first 20)...\n");

    // Get first 20 active products
    const result = await client.query(
      `SELECT 
        products.id,
        products.name,
        products.price,
        stores.store_name,
        categories.name as category_name
      FROM products 
      LEFT JOIN stores ON products.store_id = stores.id
      LEFT JOIN categories ON products.category_id = categories.id
      WHERE products.is_active = true
      ORDER BY products.id DESC
      LIMIT 30`
    );

    console.log(`Total products found: ${result.rows.length}\n`);
    result.rows.forEach((p, idx) => {
      console.log(`${idx + 1}. ID: ${p.id} | ${p.store_name} - ${p.name || '[No name]'} | Price: ${p.price}`);
    });

    // Also check if 95 exists at all
    const checkDel = await client.query(`SELECT id FROM products WHERE id = 95`);
    console.log(`\nProduct 95 exists: ${checkDel.rows.length > 0 ? 'YES' : 'NO'}`);

    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkProducts();
