import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function simulateApiResponse() {
  try {
    console.log('🔍 === SIMULATING API RESPONSES FOR STORE 13 ===\n');
    
    // Simulate GET /api/topup/categories/13 (No is_active filter typically)
    const categories = await pool.query(
      `SELECT id, store_id, name, is_active, created_at 
       FROM topup_product_categories 
       WHERE store_id = $1 
       ORDER BY id`,
      [13]
    );
    console.log('📂 GET /api/topup/categories/13');
    console.log(`   Returns ${categories.rows.length} items`);
    categories.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name}`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Simulate GET /api/topup/products/13 (With is_active = true filter)
    const products = await pool.query(
      `SELECT 
        tp.id, tp.store_id, tp.company_id, tp.category_id, 
        tp.amount, tp.price, tp.retail_price, tp.wholesale_price, 
        tp.available_codes, tp.is_active,
        tc.name as company_name,
        tpc.name as category_name
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id AND tc.store_id = tp.store_id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = $1 AND tp.is_active = true
       ORDER BY tp.company_id, tp.category_id, tp.amount`,
      [13]
    );
    console.log('📦 GET /api/topup/products/13 (with is_active = true filter)');
    console.log(`   Returns ${products.rows.length} items (These are the ONLY ones shown in UI)`);
    products.rows.forEach((p, i) => {
      console.log(`   [${i+1}] ${p.company_name} > ${p.category_name} > ${p.amount} IQD (Price: ${p.price})`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Show what's excluded (is_active = false)
    const inactive = await pool.query(
      `SELECT id, amount, company_id, category_id, is_active
       FROM topup_products
       WHERE store_id = $1 AND is_active = false`,
      [13]
    );
    console.log('🚫 These products are HIDDEN (is_active = false):');
    console.log(`   Count: ${inactive.rows.length} hidden products`);
    inactive.rows.forEach(p => {
      console.log(`   Product ID ${p.id}: Amount ${p.amount} (Active: ${p.is_active})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

simulateApiResponse();
