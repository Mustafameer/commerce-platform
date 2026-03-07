const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function addProducts() {
  try {
    // Delete existing products to start fresh
    await pool.query('DELETE FROM topup_products WHERE store_id = 13');
    console.log('✓ Deleted existing products');

    // Products structure: 2 products per category, with 5000 IQD each
    const products = [
      // Category 18 - زين اثير - 5000
      { store_id: 13, company_id: 1, category_id: 18, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 2, category_id: 18, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 19 - آسيا سيل - 5000
      { store_id: 13, company_id: 2, category_id: 19, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 3, category_id: 19, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 20 - كورك - 5000
      { store_id: 13, company_id: 3, category_id: 20, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 4, category_id: 20, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 21 - امنية - 5000 (NEW)
      { store_id: 13, company_id: 4, category_id: 21, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 1, category_id: 21, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 22 - امنية - 50000 (NEW - Higher amount)
      { store_id: 13, company_id: 1, category_id: 22, amount: 50000, price: 52000, retail_price: 52000, wholesale_price: 51000, available_codes: 50 },
      { store_id: 13, company_id: 2, category_id: 22, amount: 50000, price: 52000, retail_price: 52000, wholesale_price: 51000, available_codes: 50 }
    ];

    for (const product of products) {
      await pool.query(
        `INSERT INTO topup_products 
        (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
        [product.store_id, product.company_id, product.category_id, product.amount, product.price, product.retail_price, product.wholesale_price, product.available_codes]
      );
    }

    console.log('✓ Added 10 products (2 per category)');

    // Verify
    const result = await pool.query(
      `SELECT category_id, COUNT(*) as count FROM topup_products WHERE store_id = 13 GROUP BY category_id ORDER BY category_id`
    );
    
    console.log('\n=== FINAL DATA ===');
    result.rows.forEach(r => {
      console.log(`Category ${r.category_id}: ${r.count} products`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addProducts();
