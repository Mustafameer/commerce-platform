import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:Aa123123@localhost:5432/commerce'
});

async function checkData() {
  try {
    console.log('🔍 Checking database for store 13 data...\n');

    // Check categories
    const categoriesResult = await pool.query(
      'SELECT * FROM topup_product_categories WHERE store_id = 13 ORDER BY id'
    );
    console.log('✅ Categories for store 13:');
    console.log(`   Count: ${categoriesResult.rows.length}`);
    if (categoriesResult.rows.length > 0) {
      categoriesResult.rows.forEach(cat => {
        console.log(`   ID: ${cat.id}, Name: ${cat.name}, Active: ${cat.is_active}`);
      });
    } else {
      console.log('   ❌ NO CATEGORIES FOUND');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check products
    const productsResult = await pool.query(
      'SELECT * FROM topup_products WHERE store_id = 13 ORDER BY id'
    );
    console.log('✅ Products for store 13:');
    console.log(`   Count: ${productsResult.rows.length}`);
    if (productsResult.rows.length > 0) {
      productsResult.rows.forEach(prod => {
        console.log(`   ID: ${prod.id}, Company: ${prod.company_id}, Category: ${prod.category_id}, Amount: ${prod.amount}, Price: ${prod.price}`);
      });
    } else {
      console.log('   ❌ NO PRODUCTS FOUND');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check all categories
    const allCategoriesResult = await pool.query(
      'SELECT store_id, COUNT(*) as count FROM topup_product_categories GROUP BY store_id'
    );
    console.log('✅ Categories by store:');
    allCategoriesResult.rows.forEach(row => {
      console.log(`   Store ${row.store_id}: ${row.count} categories`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Check all products
    const allProductsResult = await pool.query(
      'SELECT store_id, COUNT(*) as count FROM topup_products GROUP BY store_id'
    );
    console.log('✅ Products by store:');
    allProductsResult.rows.forEach(row => {
      console.log(`   Store ${row.store_id}: ${row.count} products`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkData();
