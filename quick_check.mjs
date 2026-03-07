import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function quickCheck() {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM topup_product_categories WHERE store_id = 13`
    );
    console.log('Categories for store 13:', result.rows[0].count);
    
    const result2 = await pool.query(
      `SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13`
    );
    console.log('Products for store 13:', result2.rows[0].count);
    
    // Show all data by store
    const result3 = await pool.query(
      `SELECT store_id, COUNT(*) as cat_count FROM topup_product_categories GROUP BY store_id ORDER BY store_id`
    );
    console.log('\nCategories by store:');
    result3.rows.forEach(r => console.log(`  Store ${r.store_id}: ${r.cat_count}`));
    
    const result4 = await pool.query(
      `SELECT store_id, COUNT(*) as prod_count FROM topup_products GROUP BY store_id ORDER BY store_id`
    );
    console.log('\nProducts by store:');
    result4.rows.forEach(r => console.log(`  Store ${r.store_id}: ${r.prod_count}`));
    
    await pool.end();
  } catch (error) {
    console.error('❌', error.message);
    await pool.end();
  }
}

quickCheck();
