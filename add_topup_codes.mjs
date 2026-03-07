import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function addTopupCodes() {
  try {
    console.log("🔍 Fetching topup store products...");
    const storesResult = await pool.query(`
      SELECT id FROM stores WHERE store_type = 'topup' LIMIT 1
    `);
    
    if (storesResult.rows.length === 0) {
      console.log("❌ No topup stores found");
      process.exit(1);
    }
    
    const storeId = storesResult.rows[0].id;
    console.log(`\n📍 Processing store ID: ${storeId}`);
    
    const productsResult = await pool.query(`
      SELECT id, name FROM products WHERE store_id = $1 ORDER BY id LIMIT 1
    `, [storeId]);
    
    if (productsResult.rows.length === 0) {
      console.log("❌ No products in topup store");
      process.exit(1);
    }
    
    const product = productsResult.rows[0];
    console.log(`\n📦 Found product: "${product.name}" (ID: ${product.id})`);
    
    // Generate sample codes
    const codes = [];
    for (let i = 1; i <= 50; i++) {
      codes.push(`CODE-${Date.now()}-${String(i).padStart(3, '0')}`);
    }
    
    console.log(`\n🔑 Generated ${codes.length} sample codes`);
    console.log(`   Sample: ${codes.slice(0, 3).join(', ')}...`);
    
    // Update product with codes
    const updateResult = await pool.query(
      `UPDATE products SET topup_codes = $1, stock = $2 WHERE id = $3 RETURNING topup_codes, stock`,
      [codes, codes.length, product.id]
    );
    
    const updatedProduct = updateResult.rows[0];
    console.log(`\n✅ Updated product with ${updatedProduct.stock} codes`);
    console.log(`\n✨ Now you can:`);
    console.log(`   1. Buy 3-5 codes from the topup store`);
    console.log(`   2. Check out and receive the codes in the confirmation`);
    console.log(`   3. Codes will be deleted from inventory after purchase`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addTopupCodes();
