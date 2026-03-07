const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function setupAndMigrateProducts() {
  try {
    await client.connect();

    console.log("\n🚀 بدء إعداد وتوفير البيانات...\n");

    // Step 1: Create default categories in topup_product_categories
    console.log("1️⃣ إنشاء الأقسام في topup_product_categories...");

    const categoryNames = ["عام", "توب أب"];
    let categoryIds = {};

    for (const catName of categoryNames) {
      const checkResult = await client.query(
        `SELECT id FROM topup_product_categories 
         WHERE store_id = 13 AND name = $1`,
        [catName]
      );

      if (checkResult.rows.length === 0) {
        const insertResult = await client.query(
          `INSERT INTO topup_product_categories 
           (store_id, name, is_active, created_at)
           VALUES (13, $1, true, NOW())
           RETURNING id`,
          [catName]
        );
        categoryIds[catName] = insertResult.rows[0].id;
        console.log(`   ✅ تم إنشاء: "${catName}" (ID: ${categoryIds[catName]})`);
      } else {
        categoryIds[catName] = checkResult.rows[0].id;
        console.log(`   ⏭️ موجود بالفعل: "${catName}" (ID: ${categoryIds[catName]})`);
      }
    }

    // Step 2: Migrate products
    console.log("\n2️⃣ نقل المنتجات من products إلى topup_products...");

    const productsResult = await client.query(
      `SELECT p.id, p.name, p.category_id, c.name as category_name, p.price
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.store_id = 13
       ORDER BY p.id`
    );

    console.log(`   📦 وجدت ${productsResult.rows.length} منتج\n`);

    let migratedCount = 0;

    for (const product of productsResult.rows) {
      // Find the corresponding company
      const companyResult = await client.query(
        `SELECT id FROM topup_companies 
         WHERE store_id = 13 AND name = $1 AND is_active = true`,
        [product.category_name]
      );

      if (companyResult.rows.length > 0) {
        const companyId = companyResult.rows[0].id;

        // Check if product already exists
        const existsResult = await client.query(
          `SELECT id FROM topup_products 
           WHERE store_id = 13 AND company_id = $1 AND amount = $2`,
          [companyId, parseInt(product.name)]
        );

        if (existsResult.rows.length === 0) {
          // Use the first category ID as default
          const defaultCategoryId = categoryIds["عام"];

          // Insert the product
          const insertResult = await client.query(
            `INSERT INTO topup_products 
             (store_id, company_id, category_id, amount, price, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
             RETURNING id`,
            [
              13,
              companyId,
              defaultCategoryId,
              parseInt(product.name),
              Math.round(product.price),
            ]
          );

          console.log(
            `   ✅ تم نقل: "${product.name}" دينار من "${product.category_name}" → Company ID: ${companyId}`
          );
          migratedCount++;
        }
      }
    }

    console.log(`\n✨ تم نقل ${migratedCount} منتج بنجاح`);

    // Step 3: Verify migration
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13`
    );

    console.log(`\n3️⃣ التحقق:
   ✅ المنتجات في topup_products: ${verifyResult.rows[0].count}
   ✅ الأقسام المتاحة: ${Object.keys(categoryIds).join(", ")}
   
🎉 تم إعداد البيانات بنجاح!`);

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

setupAndMigrateProducts();
