const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function reorganizeData() {
  try {
    console.log('🧹 === REORGANIZE DATA STRUCTURE ===\n');

    // Step 1: Delete all current data
    await pool.query('DELETE FROM topup_products WHERE store_id = 13');
    await pool.query('DELETE FROM topup_product_categories WHERE store_id = 13');
    console.log('✅ Deleted old structure\n');

    // Step 2: Create new categories (Product Types)
    // Format: "Company Name - 5000"
    const categories = [
      { name: 'زين - 5000' },    // Zain - 5000
      { name: 'آسيا سيل - 5000' }, // Asiacell - 5000
      { name: 'أوريدو - 5000' },   // Ooredoo - 5000
      { name: 'هالو تل - 5000' }   // HaloTel - 5000
    ];

    console.log('📂 Creating product type categories:\n');
    const categoryIds = {};
    for (let cat of categories) {
      const result = await pool.query(
        'INSERT INTO topup_product_categories (store_id, name, is_active) VALUES ($1, $2, true) RETURNING id',
        [13, cat.name]
      );
      categoryIds[cat.name] = result.rows[0].id;
      console.log(`   ✅ ${cat.name} (ID: ${result.rows[0].id})`);
    }

    // Step 3: Create products (6 total - one for each product type, one duplicate company)
    console.log('\n📦 Creating products:\n');
    
    const products = [
      // For category "زين - 5000"
      { company_id: 1, category_name: 'زين - 5000', amount: 5000 },
      { company_id: 2, category_name: 'زين - 5000', amount: 5000 },
      
      // For category "آسيا سيل - 5000"
      { company_id: 2, category_name: 'آسيا سيل - 5000', amount: 5000 },
      { company_id: 3, category_name: 'آسيا سيل - 5000', amount: 5000 },
      
      // For category "أوريدو - 5000"
      { company_id: 3, category_name: 'أوريدو - 5000', amount: 5000 },
      { company_id: 4, category_name: 'أوريدو - 5000', amount: 5000 }
    ];

    for (let prod of products) {
      const categoryId = categoryIds[prod.category_name];
      await pool.query(
        'INSERT INTO topup_products (store_id, company_id, category_id, amount, price, retail_price, wholesale_price, available_codes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)',
        [13, prod.company_id, categoryId, prod.amount, 5200, 5200, 5100, 50]
      );
      
      const companyRes = await pool.query('SELECT name FROM topup_companies WHERE id = $1', [prod.company_id]);
      const companyName = companyRes.rows[0].name;
      console.log(`   ✅ ${companyName} → ${prod.category_name}`);
    }

    console.log('\n✅ DONE! Structure updated:\n');
    console.log('📊 Final structure:\n');
    console.log('   القسم (Dropdown 1): الشركات');
    console.log('      - زين');
    console.log('      - آسيا سيل');
    console.log('      - أوريدو');
    console.log('      - هالو تل');
    console.log('\n   الفئة (Dropdown 2): نوع المنتج');
    console.log('      - زين - 5000');
    console.log('      - آسيا سيل - 5000');
    console.log('      - أوريدو - 5000');
    console.log('      - هالو تل - 5000');

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

reorganizeData();
