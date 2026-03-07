const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkMapping() {
  try {
    await client.connect();

    console.log("\n🔗 العلاقة بين الفئات والشركات...\n");

    // Get categories
    const categoriesResult = await client.query(
      `SELECT c.id, c.name, c.store_id
       FROM categories c
       WHERE c.store_id = 13
       ORDER BY c.id`
    );

    console.log("📂 الفئات في جدول categories:");
    categoriesResult.rows.forEach((cat) => {
      console.log(`   - ID: ${cat.id}, الاسم: ${cat.name}`);
    });

    // Get companies
    const companiesResult = await client.query(
      `SELECT id, name, store_id
       FROM topup_companies
       WHERE store_id = 13
       ORDER BY id`
    );

    console.log("\n🏢 الشركات في جدول topup_companies:");
    companiesResult.rows.forEach((comp) => {
      console.log(`   - ID: ${comp.id}, الاسم: ${comp.name}`);
    });

    // Check products with their categories
    console.log("\n📦 المنتجات مع الفئات:");
    const productsResult = await client.query(
      `SELECT p.id, p.name, p.category_id, c.name as category_name, p.price
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.store_id = 13
       ORDER BY p.id DESC`
    );

    productsResult.rows.forEach((prod) => {
      console.log(
        `   - المنتج ID: ${prod.id} (${prod.name}) من الفئة ID: ${prod.category_id} (${prod.category_name}), السعر: ${prod.price}`
      );
    });

    // Now check which company corresponds to which category
    console.log("\n🔍 المقابلة بين الفئات والشركات:");
    for (const product of productsResult.rows) {
      const companyQuery = await client.query(
        `SELECT id, name FROM topup_companies WHERE name = $1 AND store_id = 13`,
        [product.category_name]
      );
      if (companyQuery.rows.length > 0) {
        console.log(
          `   ✅ الفئة "${product.category_name}" (ID: ${product.category_id}) = الشركة "${companyQuery.rows[0].name}" (ID: ${companyQuery.rows[0].id})`
        );
      } else {
        console.log(
          `   ❌ الفئة "${product.category_name}" (ID: ${product.category_id}) ليس لها شركة مقابلة`
        );
      }
    }

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

checkMapping();
