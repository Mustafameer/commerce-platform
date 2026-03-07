const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function cleanupProducts() {
  try {
    console.log('🧹 === CLEANUP: DELETE UNWANTED PRODUCTS ===\n');

    // Keep only 5000 IQD per category, 2 per category
    // Delete: ID 39 (10000), 41 (15000), 42 (10000), 43 (25000)
    const toDelete = [39, 41, 42, 43];
    
    for (let id of toDelete) {
      await pool.query('DELETE FROM topup_products WHERE id = $1', [id]);
      console.log(`   ✅ Deleted product ${id}`);
    }

    console.log('\n✅ Cleanup complete!\n');
    console.log('📊 Remaining products:\n');

    const res = await pool.query(
      'SELECT tp.id, tc.name as company, tpc.name as category, tp.amount FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = 13 ORDER BY tpc.id, tp.company_id'
    );

    console.log(`   Total: ${res.rows.length} منتجات\n`);
    res.rows.forEach(p => {
      console.log(`   [${p.id}] ${p.company} > ${p.category} > ${p.amount} IQD`);
    });

    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanupProducts();
