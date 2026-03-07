const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function migrateProducts() {
  try {
    await client.connect();

    console.log("\n🚀 بدء نقل المنتجات من products إلى topup_products...\n");

    // Get all products from store 13
    const productsResult = await client.query(
      `SELECT p.id, p.name, p.category_id, c.name as category_name, p.price
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.store_id = 13
       ORDER BY p.id`
    );

    console.log(`📦 وجدت ${productsResult.rows.length} منتج للنقل\n`);

    let migratedCount = 0;

    for (const product of productsResult.rows) {
      // Find the corresponding company by category name
      const companyResult = await client.query(
        `SELECT id FROM topup_companies 
         WHERE store_id = 13 AND name = $1 AND is_active = true`,
        [product.category_name]
      );

      if (companyResult.rows.length > 0) {
        const companyId = companyResult.rows[0].id;

        // Check if product already exists in topup_products
        const existsResult = await client.query(
          `SELECT id FROM topup_products 
           WHERE store_id = 13 AND company_id = $1 AND amount = $2`,
          [companyId, parseInt(product.name)]
        );

        if (existsResult.rows.length === 0) {
          // Insert the product
          const insertResult = await client.query(
            `INSERT INTO topup_products 
             (store_id, company_id, category_id, amount, price, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
             RETURNING id`,
            [13, companyId, product.category_id, parseInt(product.name), Math.round(product.price)]
          );

          console.log(
            `✅ تم نقل: "${product.name}" دينار من "${product.category_name}" (Company ID: ${companyId})`
          );
          migratedCount++;
        }
      } else {
        console.log(
          `⚠️  تحذير: لم أجد شركة لـ "${product.category_name}"`
        );
      }
    }

    console.log(`\n✨ تم نقل ${migratedCount} منتج بنجاح`);

    // Verify migration
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13`
    );

    console.log(`\n✅ النتيجة النهائية: ${verifyResult.rows[0].count} منتج في topup_products\n`);

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

migrateProducts();
