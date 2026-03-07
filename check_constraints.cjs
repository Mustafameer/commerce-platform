const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkConstraints() {
  try {
    await client.connect();

    console.log("\n🔍 التحقق من القيود...\n");

    // Check topup_product_categories
    const categoriesResult = await client.query(
      `SELECT id, store_id, name FROM topup_product_categories 
       WHERE store_id = 13`
    );

    console.log("📂 الفئات في topup_product_categories:");
    console.log(`   عدد الفئات: ${categoriesResult.rows.length}`);
    if (categoriesResult.rows.length > 0) {
      categoriesResult.rows.forEach((cat) => {
        console.log(`   - ID: ${cat.id}, الاسم: ${cat.name}`);
      });
    } else {
      console.log("   لا توجد فئات");
    }

    // Check topup_companies
    const companiesResult = await client.query(
      `SELECT id, store_id, name FROM topup_companies 
       WHERE store_id = 13`
    );

    console.log("\n🏢 الشركات في topup_companies:");
    companiesResult.rows.forEach((comp) => {
      console.log(`   - ID: ${comp.id}, الاسم: ${comp.name}`);
    });

    // Check the foreign key constraints
    console.log("\n📋 معلومات القيود:");
    const constraintResult = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'topup_products'
    `);

    console.log("\nقيود المفاتيح الأجنبية في topup_products:");
    constraintResult.rows.forEach((constraint) => {
      console.log(
        `   - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`
      );
    });

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

checkConstraints();
