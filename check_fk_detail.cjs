const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkFK() {
  try {
    await client.connect();

    console.log("\n🔍 تفاصيل القيد الخارجي للـ category_id...\n");

    // Get FK constraint details
    const fkResult = await client.query(`
      SELECT 
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM (
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name as referenced_table_name,
          ccu.column_name as referenced_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'topup_products'
          AND kcu.column_name = 'category_id'
      ) t
    `);

    console.log("القيد الخارجي:");
    if (fkResult.rows.length > 0) {
      const fk = fkResult.rows[0];
      console.log(`   من: ${fk.table_name}.${fk.column_name}`);
      console.log(`   إلى: ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      console.log(`   اسم القيد: ${fk.constraint_name}`);
    }

    // Check if we need to create categories first
    console.log("\n\n💡 الحل:");
    console.log("1. نحتاج إلى إنشاء categories في topup_product_categories");
    console.log("2. أو حذف القيد الخارجي للـ category_id");
    console.log("3. أو جعل category_id اختياري (NULL)");

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

checkFK();
