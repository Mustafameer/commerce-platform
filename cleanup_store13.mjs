import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function cleanupStore13() {
  try {
    console.log('🧹 === CLEANING UP STORE 13 ===\n');
    
    // Step 1: Delete old products (IDs 1-16, all auto-seeded)
    console.log('🗑️  Deleting 16 old auto-seeded products...');
    const deleteProducts = await pool.query(
      `DELETE FROM topup_products WHERE store_id = 13 AND id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)`
    );
    console.log(`   ✅ Deleted ${deleteProducts.rowCount} old products`);
    
    // Step 2: Delete old categories with encoding issues (IDs 9-14)
    console.log('\n🗑️  Deleting broken/encoding categories...');
    const deleteOldCats = await pool.query(
      `DELETE FROM topup_product_categories WHERE store_id = 13 AND id IN (9,10,11,12,13,14)`
    );
    console.log(`   ✅ Deleted ${deleteOldCats.rowCount} broken categories`);
    
    // Step 3: Delete auto-seeded categories with English names (IDs 1-4)
    console.log('\n🗑️  Deleting old auto-seeded categories...');
    const deleteAutoSeeded = await pool.query(
      `DELETE FROM topup_product_categories WHERE store_id = 13 AND id IN (1,2,3,4)`
    );
    console.log(`   ✅ Deleted ${deleteAutoSeeded.rowCount} auto-seeded categories`);
    
    // Verify cleanup
    console.log('\n\n📊 === VERIFICATION ===\n');
    const finalCats = await pool.query(
      `SELECT id, name FROM topup_product_categories WHERE store_id = 13 ORDER BY id`
    );
    console.log(`✅ Categories remaining: ${finalCats.rows.length}`);
    finalCats.rows.forEach(c => {
      console.log(`   [${c.id}] ${c.name}`);
    });
    
    const finalProds = await pool.query(
      `SELECT tp.id, tc.name as company, tpc.name as category, tp.amount 
       FROM topup_products tp
       LEFT JOIN topup_companies tc ON tp.company_id = tc.id
       LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id
       WHERE tp.store_id = 13
       ORDER BY tp.id`
    );
    console.log(`\n✅ Products remaining: ${finalProds.rows.length}`);
    finalProds.rows.forEach(p => {
      console.log(`   [${p.id}] ${p.company} > ${p.category} > ${p.amount} IQD`);
    });
    
    console.log('\n✅ CLEANUP COMPLETE! Store 13 is now clean with only new merchant data.');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

cleanupStore13();
