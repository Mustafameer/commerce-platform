const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function addProductsToNewCategory() {
  try {
    console.log('📦 === ADDING PRODUCTS TO NEW CATEGORY ===\n');

    // Add 2 products to category 21 (امنية - 5000)
    const products = [
      { company_id: 1, category_id: 21, amount: 5000, price: 5200 }, // زين اثير
      { company_id: 2, category_id: 21, amount: 5000, price: 5200 }  // آسيا سيل
    ];

    for (let prod of products) {
      await pool.query(
        'INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)',
        [13, prod.company_id, prod.category_id, prod.amount, prod.price, prod.price, 5100, 50]
      );
    }

    console.log('   ✅ Added 2 products to category 21 (امنية - 5000)\n');

    // Verify
    console.log('📊 Verifying all categories now have products:\n');
    
    const cats = await pool.query(
      'SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    
    for (let cat of cats.rows) {
      const count = await pool.query(
        'SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13 AND category_id = $1',
        [cat.id]
      );
      const hasProducts = count.rows[0].count > 0;
      console.log(`   [${cat.id}] ${cat.name}: ${count.rows[0].count} منتجات ${hasProducts ? '✅' : '❌'}`);
    }

    console.log('\n✅ ALL CATEGORIES NOW HAVE PRODUCTS!');

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addProductsToNewCategory();
