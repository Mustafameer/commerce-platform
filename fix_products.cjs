const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function addProducts() {
  try {
    // Delete existing products
    await pool.query('DELETE FROM topup_products WHERE store_id = 13');
    console.log('✓ تم حذف المنتجات القديمة');

    // Products structure - CORRECTED
    const products = [
      // Category 18 - زين اثير - 5000
      { store_id: 13, company_id: 1, category_id: 18, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 1, category_id: 18, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 19 - آسيا سيل - 5000
      { store_id: 13, company_id: 2, category_id: 19, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 2, category_id: 19, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 20 - كورك - 5000
      { store_id: 13, company_id: 3, category_id: 20, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 3, category_id: 20, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 21 - امنية - 5000
      { store_id: 13, company_id: 4, category_id: 21, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      { store_id: 13, company_id: 4, category_id: 21, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // Category 22 - امنية - 50000 (ONLY امنية company)
      { store_id: 13, company_id: 4, category_id: 22, amount: 50000, price: 52000, retail_price: 52000, wholesale_price: 51000, available_codes: 50 },
      { store_id: 13, company_id: 4, category_id: 22, amount: 50000, price: 52000, retail_price: 52000, wholesale_price: 51000, available_codes: 50 }
    ];

    for (const product of products) {
      await pool.query(
        `INSERT INTO topup_products 
        (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
        [product.store_id, product.company_id, product.category_id, product.amount, product.price, product.retail_price, product.wholesale_price, product.available_codes]
      );
    }

    console.log('✓ تم إضافة 10 منتجات بالتوزيع الصحيح');

    // Verify
    const result = await pool.query(`
      SELECT tp.amount, tc.name as company, tpc.name as category, COUNT(*) as count 
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13
      GROUP BY tp.amount, tc.name, tpc.name
      ORDER BY tp.category_id
    `);
    
    console.log('\n=== التحقق من البيانات ===');
    result.rows.forEach(r => {
      console.log(`${r.category}: ${r.company} - ${r.amount} دينار | ${r.count} منتج`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addProducts();
