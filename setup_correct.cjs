const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function setupCorrectData() {
  try {
    console.log('🧹 === SETUP CORRECT DATA ===\n');

    // Delete all current products
    await pool.query('DELETE FROM topup_products WHERE store_id = 13');
    console.log('✅ Deleted all products\n');

    // Add exactly 6 products: 2 per category, all 5000 IQD
    const products = [
      // Category 15: أملية (2 products)
      { company_id: 1, category_id: 15, amount: 5000, price: 5200 },  // زين
      { company_id: 2, category_id: 15, amount: 5000, price: 5200 },  // آسيا سيل
      
      // Category 16: كوركس (2 products)
      { company_id: 3, category_id: 16, amount: 5000, price: 5200 },  // أوريدو
      { company_id: 4, category_id: 16, amount: 5000, price: 5200 },  // هالو تل
      
      // Category 17: زين الاخر (2 products)
      { company_id: 1, category_id: 17, amount: 5000, price: 5200 },  // زين
      { company_id: 2, category_id: 17, amount: 5000, price: 5200 }   // آسيا سيل
    ];

    console.log('📦 Adding products:\n');
    for (let prod of products) {
      await pool.query(
        'INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)',
        [13, prod.company_id, prod.category_id, prod.amount, prod.price, prod.price, 5100, 50]
      );
    }

    console.log(`   ✅ Added ${products.length} منتجات\n`);

    // Verify
    console.log('📊 Final data:\n');
    const res = await pool.query(
      'SELECT tp.id, tc.name as company, tpc.name as category, tp.amount FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = 13 ORDER BY tpc.id, tp.company_id'
    );

    console.log(`   Total: ${res.rows.length} منتجات\n`);
    res.rows.forEach((p, i) => {
      console.log(`   [${i+1}] ${p.company} > ${p.category} > ${p.amount} IQD`);
    });

    console.log('\n✅ READY! 2 products per category, all 5000 IQD');

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setupCorrectData();
