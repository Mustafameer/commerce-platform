import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function setupTopupProducts() {
  try {
    console.log("🔍 Fetching topup store...");
    const storesResult = await pool.query(`
      SELECT id, store_name FROM stores WHERE store_type = 'topup' LIMIT 1
    `);
    
    if (storesResult.rows.length === 0) {
      console.log("❌ No topup stores found");
      process.exit(1);
    }
    
    const store = storesResult.rows[0];
    console.log(`\n📍 Found topup store: "${store.store_name}" (ID: ${store.id})`);
    
    // Generate sample codes (50 codes)
    const codesArray = [];
    for (let i = 1; i <= 50; i++) {
      codesArray.push(`CODE-${String(i).padStart(3, '0')}`);
    }
    
    console.log(`\n🔑 Creating sample topup products with codes...`);
    
    // Create sample products
    const products = [
      { name: 'شحنة 5 جنية', description: 'شحنة 5 جنية', price: 5, codes: codesArray.slice(0, 25) },
      { name: 'شحنة 10 جنية', description: 'شحنة 10 جنية', price: 10, codes: codesArray.slice(25, 50) }
    ];
    
    for (const prod of products) {
      const result = await pool.query(
        `INSERT INTO products (store_id, name, description, price, image_url, stock, topup_codes, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
         RETURNING id, name, stock`,
        [store.id, prod.name, prod.description, prod.price, '', prod.codes.length, prod.codes]
      );
      
      const createdProd = result.rows[0];
      console.log(`\n✅ Created: "${createdProd.name}"`);
      console.log(`   • Stock: ${createdProd.stock} codes`);
      console.log(`   • Price: ${prod.price}₪`);
      console.log(`   • Sample codes: ${prod.codes.slice(0, 2).join(', ')}...`);
    }
    
    console.log(`\n\n✨ التجربة الآن:`);
    console.log(`   1. ادخل لـ متجر الأكواد`);
    console.log(`   2. اختر منتج وأضفه للسلة (3-5 أكواد مثلاً)`);
    console.log(`   3. اذهب للـ checkout`);
    console.log(`   4. شاهد الأكواد في رسالة التأكيد`);
    console.log(`   5. الأكواد تُحذف من المخزون تلقائياً ✓`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setupTopupProducts();
