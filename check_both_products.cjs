const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkTopupProducts() {
  try {
    await client.connect();

    console.log("\n🎟️ TOPUP PRODUCTS (Recharge Cards)\n");

    // Get all topup products
    const result = await client.query(
      `SELECT 
        topup_products.id,
        topup_products.name,
        topup_products.price,
        topup_products.topup_company_id,
        topup_companies.name as company_name
      FROM topup_products 
      LEFT JOIN topup_companies ON topup_products.topup_company_id = topup_companies.id
      ORDER BY topup_products.id`
    );

    console.log(`Total topup products: ${result.rows.length}\n`);
    result.rows.forEach((p, idx) => {
      console.log(`${idx + 1}. ID: ${p.id} | ${p.company_name} - ${p.name} | Price: ${p.price}`);
    });

    // Check if 95 exists in topup_products
    const check95 = await client.query(`SELECT id FROM topup_products WHERE id = 95`);
    console.log(`\n❓ Topup Product 95 exists: ${check95.rows.length > 0 ? 'YES' : 'NO'}`);

    // Also check regular products
    console.log("\n📦 REGULAR PRODUCTS\n");
    const regProducts = await client.query(
      `SELECT 
        products.id,
        products.name,
        products.price,
        stores.store_name
      FROM products 
      LEFT JOIN stores ON products.store_id = stores.id
      ORDER BY products.id DESC`
    );

    console.log(`Total regular products: ${regProducts.rows.length}\n`);
    regProducts.rows.forEach((p, idx) => {
      console.log(`${idx + 1}. ID: ${p.id} | ${p.store_name} - ${p.name} | Price: ${p.price}`);
    });

    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTopupProducts();
