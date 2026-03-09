import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:lUvxArS7tPYwMhNVOWOL@web-production-9efff.up.railway.app:5432/railway'
});

async function setupTopupData() {
  try {
    const storeId = 13;
    
    console.log(`\n🔧 Setting up TopUp store ${storeId}...\n`);
    
    // 1. Add categories
    const catCheck = await pool.query('SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = $1', [storeId]);
    if (catCheck.rows[0].count === 0) {
      console.log('📌 Adding categories...');
      const categories = ['زين', 'آسيا سيل', 'كورك', 'امنية'];
      for (const cat of categories) {
        await pool.query(
          'INSERT INTO topup_product_categories (store_id, name, is_active) VALUES ($1, $2, true)',
          [storeId, cat]
        );
      }
      console.log(`✅ Added ${categories.length} categories\n`);
    }
    
    // 2. Get or create companies
    const compCheck = await pool.query('SELECT id FROM topup_companies WHERE store_id = $1 LIMIT 1', [storeId]);
    let companyId;
    
    if (compCheck.rows.length === 0) {
      console.log('📌 Adding company...');
      const compRes = await pool.query(
        'INSERT INTO topup_companies (store_id, name, logo_url, is_active) VALUES ($1, $2, $3, true) RETURNING id',
        [storeId, 'Zain', 'https://via.placeholder.com/100?text=Zain']
      );
      companyId = compRes.rows[0].id;
      console.log(`✅ Added company with ID ${companyId}\n`);
    } else {
      companyId = compCheck.rows[0].id;
      console.log(`📌 Using existing company ID ${companyId}\n`);
    }
    
    // 3. Add products
    const prodCheck = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1', [storeId]);
    if (prodCheck.rows[0].count === 0) {
      console.log('📌 Adding products...');
      const products = [
        { amount: 5000, price: 5500, retail_price: 5400, wholesale_price: 5300 },
        { amount: 10000, price: 11000, retail_price: 10800, wholesale_price: 10600 },
        { amount: 25000, price: 27500, retail_price: 27000, wholesale_price: 26500 },
        { amount: 50000, price: 55000, retail_price: 54000, wholesale_price: 53000}
      ];
      
      for (const prod of products) {
        // Create codes array
        const codes = [];
        for (let i = 0; i < 10; i++) {
          codes.push(`CODE-${storeId}-${prod.amount}-${String(i).padStart(3, '0')}`);
        }
        
        await pool.query(
          `INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, codes, available_codes, is_active) 
           VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, true)`,
          [storeId, companyId, prod.amount, prod.price, prod.retail_price, prod.wholesale_price, codes, codes.length]
        );
        console.log(`  ✅ Added product: ${prod.amount} IQD → ${prod.price} IQD`);
      }
      console.log(`\n✅ Added ${products.length} products\n`);
    }
    
    // 4. Show summary
    const cats = await pool.query('SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = $1', [storeId]);
    const comps = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1', [storeId]);
    const prods = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1', [storeId]);
    
    console.log('📊 Store Summary:');
    console.log(`   • Categories: ${cats.rows[0].count}`);
    console.log(`   • Companies: ${comps.rows[0].count}`);
    console.log(`   • Products: ${prods.rows[0].count}`);
    
    await pool.end();
    console.log('\n✨ Setup complete!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

setupTopupData();
