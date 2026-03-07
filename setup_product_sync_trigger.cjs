const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "multi_ecommerce",
  user: "postgres",
  password: "123",
});

async function setupProductSyncTrigger() {
  try {
    await client.connect();

    console.log("\n🔧 جاري إنشاء trigger لنقل المنتجات تلقائياً...\n");

    // Drop existing trigger and function if they exist
    await client.query(`
      DROP TRIGGER IF EXISTS sync_products_to_topup 
      ON products
    `);

    await client.query(`
      DROP FUNCTION IF EXISTS sync_products_to_topup()
    `);

    console.log("1️⃣ إنشاء دالة trigger...\n");

    // Create the trigger function
    await client.query(`
      CREATE FUNCTION sync_products_to_topup() RETURNS TRIGGER AS $$
      DECLARE
        company_id INT;
        default_category_id INT;
        company_name TEXT;
      BEGIN
        -- Only for store 13 (topup store)
        IF NEW.store_id = 13 THEN
          -- Get company name from category
          SELECT c.name INTO company_name
          FROM categories c
          WHERE c.id = NEW.category_id;

          -- Find corresponding company
          SELECT tc.id INTO company_id
          FROM topup_companies tc
          WHERE tc.store_id = 13 
            AND tc.name = company_name
            AND tc.is_active = true;

          -- If company found, insert product
          IF company_id IS NOT NULL THEN
            -- Get default category ID
            SELECT id INTO default_category_id
            FROM topup_product_categories
            WHERE store_id = 13 AND name = 'عام'
            LIMIT 1;

            -- If default category doesn't exist, create it
            IF default_category_id IS NULL THEN
              INSERT INTO topup_product_categories (store_id, name, is_active, created_at)
              VALUES (13, 'عام', true, NOW())
              RETURNING id INTO default_category_id;
            END IF;

            -- Insert or update the product in topup_products
            INSERT INTO topup_products (store_id, company_id, category_id, amount, price, is_active, created_at, updated_at)
            VALUES (NEW.store_id, company_id, default_category_id, NEW.name::INT, NEW.price::INT, NEW.is_active, NOW(), NOW())
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("2️⃣ إنشاء trigger...\n");

    // Create the trigger
    await client.query(`
      CREATE TRIGGER sync_products_to_topup
      AFTER INSERT ON products
      FOR EACH ROW
      EXECUTE FUNCTION sync_products_to_topup()
    `);

    console.log("✅ تم إنشاء trigger بنجاح\n");

    // Verify products
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13`
    );

    console.log("✨ النتيجة النهائية:");
    console.log(`   المنتجات في topup_products: ${verifyResult.rows[0].count}`);

    // Show sample products
    const productsResult = await client.query(`
      SELECT tp.id, tc.name as company, tp.amount, tp.price
      FROM topup_products tp
      JOIN topup_companies tc ON tp.company_id = tc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);

    console.log("\n   منتجات موجودة:");
    productsResult.rows.forEach((p) => {
      console.log(`   - ${p.amount} دينار من ${p.company} (${p.price} دينار)`);
    });

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  } finally {
    await client.end();
  }
}

setupProductSyncTrigger();
