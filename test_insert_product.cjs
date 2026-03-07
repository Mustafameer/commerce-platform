const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function checkTableSchema() {
  try {
    await client.connect();

    console.log("\n🔍 هيكل جدول topup_products...\n");

    // Check if category_id has a constraint
    const tableResult = await client.query(`
      SELECT 
        col.column_name,
        col.data_type,
        col.is_nullable,
        COALESCE(tc.constraint_type, 'No constraint') as constraint_type
      FROM information_schema.columns col
      LEFT JOIN information_schema.key_column_usage kcu
        ON col.table_name = kcu.table_name AND col.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE col.table_name = 'topup_products'
      ORDER BY col.ordinal_position
    `);

    tableResult.rows.forEach((col) => {
      console.log(
        `${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, constraint: ${col.constraint_type})`
      );
    });

    // Try inserting without category_id
    console.log("\n\n🧪 محاولة إدراج منتج بدون category_id...\n");

    const testInsert = await client.query(
      `INSERT INTO topup_products 
       (store_id, company_id, amount, price, is_active, created_at, updated_at)
       VALUES (13, 15, 5000, 5500, true, NOW(), NOW())
       RETURNING id, category_id`
    );

    console.log("✅ نجح الإدراج!");
    console.log(`   ID: ${testInsert.rows[0].id}`);
    console.log(`   category_id: ${testInsert.rows[0].category_id}`);

    // Clean up - delete the test record
    await client.query(`DELETE FROM topup_products WHERE id = $1`, [
      testInsert.rows[0].id,
    ]);
    console.log("\n✨ تم حذف السجل التجريبي");

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

checkTableSchema();
