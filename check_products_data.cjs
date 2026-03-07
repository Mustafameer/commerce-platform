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

    console.log("\n📦 التحقق من المنتجات...\n");

    // Check products table (الجدول الأساسي - الشحن)
    const productsResult = await client.query(
      `SELECT id, store_id, category_id, name, price FROM products 
       WHERE store_id = 13 
       ORDER BY id DESC LIMIT 10`
    );

    console.log("📍 جدول products (متجر شحن - 13):");
    console.log(`   عدد المنتجات: ${productsResult.rows.length}`);
    if (productsResult.rows.length > 0) {
      productsResult.rows.forEach((p) => {
        console.log(`   - ID: ${p.id}, الفئة: ${p.category_id}, الاسم: ${p.name}, السعر: ${p.price}`);
      });
    }

    // Check topup_products table
    const topupResult = await client.query(
      `SELECT id, store_id, company_id, amount, price FROM topup_products 
       WHERE store_id = 13 
       ORDER BY id DESC LIMIT 10`
    );

    console.log("\n📍 جدول topup_products (متجر topup - 13):");
    console.log(`   عدد المنتجات: ${topupResult.rows.length}`);
    if (topupResult.rows.length > 0) {
      topupResult.rows.forEach((p) => {
        console.log(`   - ID: ${p.id}, الشركة: ${p.company_id}, المبلغ: ${p.amount}, السعر: ${p.price}`);
      });
    }

    // Check if there's a mismatch
    if (productsResult.rows.length > topupResult.rows.length) {
      console.log("\n⚠️  المشكلة: المنتجات موجودة في جدول products لكن ليست في topup_products!");
      console.log("💡 الحل: نحتاج إلى نقل المنتجات من products إلى topup_products مثل الأقسام");
    }

    // Check schema of topup_products
    console.log("\n🔍 هيكل جدول topup_products:");
    const schemaResult = await client.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'topup_products' 
       ORDER BY ordinal_position`
    );
    schemaResult.rows.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

checkProducts();
