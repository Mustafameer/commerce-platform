const pg = require('pg');
const { Pool } = pg;

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixProducts() {
  try {
    // Delete existing products
    await pool.query('DELETE FROM topup_products WHERE store_id = 13');
    console.log('✓ تم حذف جميع المنتجات');

    // فقط 3 منتجات الموجودة فعلاً
    const products = [
      // آسيا سيل - 5000
      { store_id: 13, company_id: 2, category_id: 19, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // زين اثير - 5000
      { store_id: 13, company_id: 1, category_id: 18, amount: 5000, price: 5200, retail_price: 5200, wholesale_price: 5100, available_codes: 50 },
      
      // زين اثير - 50000
      { store_id: 13, company_id: 1, category_id: 22, amount: 50000, price: 52000, retail_price: 52000, wholesale_price: 51000, available_codes: 50 }
    ];

    for (const product of products) {
      await pool.query(
        `INSERT INTO topup_products 
        (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())`,
        [product.store_id, product.company_id, product.category_id, product.amount, product.price, product.retail_price, product.wholesale_price, product.available_codes]
      );
    }

    console.log('✓ تم إضافة 3 منتجات فقط (الفعلية)');

    // Verify
    const result = await pool.query(`
      SELECT tp.id, tc.name as company, tpc.name as category, tp.amount, tp.price
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);
    
    console.log('\n=== المنتجات النهائية ===');
    result.rows.forEach(r => {
      console.log(`ID ${r.id}: ${r.company} | ${r.category} | ${r.amount} دينار | السعر: ${r.price}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixProducts();
