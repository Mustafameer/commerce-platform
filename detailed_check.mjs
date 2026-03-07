import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function detailedCheck() {
  try {
    console.log('📊 === STORE 13 DATA DETAILS ===\n');
    
    // Get all categories
    const categories = await pool.query(
      `SELECT id, name, is_active, created_at FROM topup_product_categories WHERE store_id = 13 ORDER BY id`
    );
    console.log('📂 CATEGORIES:');
    categories.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name} (Active: ${c.is_active})`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Get all products with company and category names
    const products = await pool.query(
      `SELECT 
        tp.id, tp.company_id, tp.category_id, tp.amount, tp.price, tp.is_active,
        tc.name as company_name,
        tpc.name as category_name
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = 13
       ORDER BY tp.company_id, tp.category_id, tp.id`
    );
    console.log('📦 PRODUCTS:');
    products.rows.forEach(p => {
      console.log(`   [${p.id}] ${p.company_name} > ${p.category_name} > ${p.amount} IQD (Price: ${p.price}, Active: ${p.is_active})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

detailedCheck();
