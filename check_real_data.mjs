import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkRealData() {
  try {
    console.log('🔍 === CHECKING ALL PRODUCTS IN DATABASE ===\n');

    // Get all products
    const allProducts = await pool.query(
      `SELECT 
        p.id, p.store_id, p.category_id, p.name, p.price, p.description
       FROM products p
       ORDER BY p.store_id, p.id`
    );

    console.log(`📦 TOTAL PRODUCTS IN DATABASE: ${allProducts.rows.length}\n`);
    
    // Group by store
    const byStore = {};
    allProducts.rows.forEach(p => {
      if (!byStore[p.store_id]) byStore[p.store_id] = [];
      byStore[p.store_id].push(p);
    });

    for (let storeId in byStore) {
      console.log(`\n✅ Store ${storeId}: ${byStore[storeId].length} products`);
      byStore[storeId].forEach(p => {
        console.log(`   [${p.id}] ${p.name} (Cat: ${p.category_id}, Price: ${p.price})`);
      });
    }

    // Now check topup products
    console.log('\n\n' + '='.repeat(60));
    console.log('🎯 === CHECKING TOPUP PRODUCTS ===\n');

    const topupProducts = await pool.query(
      `SELECT 
        id, store_id, company_id, category_id, amount, price
       FROM topup_products
       ORDER BY store_id, id`
    );

    console.log(`📦 TOTAL TOPUP PRODUCTS: ${topupProducts.rows.length}\n`);

    const byTopupStore = {};
    topupProducts.rows.forEach(p => {
      if (!byTopupStore[p.store_id]) byTopupStore[p.store_id] = [];
      byTopupStore[p.store_id].push(p);
    });

    for (let storeId in byTopupStore) {
      console.log(`\n✅ Store ${storeId}: ${byTopupStore[storeId].length} topup products`);
      byTopupStore[storeId].forEach(p => {
        console.log(`   [${p.id}] Company: ${p.company_id}, Category: ${p.category_id}, Amount: ${p.amount} IQD, Price: ${p.price}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkRealData();
