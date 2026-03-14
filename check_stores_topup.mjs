import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/commerce'
});

(async () => {
  try {
    // Get all stores
    const stores = await pool.query('SELECT id, store_name, slug FROM stores LIMIT 10');
    console.log('📍 All Stores:');
    stores.rows.forEach(s => console.log(`  - ID: ${s.id}, Name: ${s.store_name}, Slug: ${s.slug}`));

    // Get stores with topup products
    const topupStores = await pool.query(`
      SELECT DISTINCT tp.store_id, s.store_name 
      FROM topup_products tp
      LEFT JOIN stores s ON tp.store_id = s.id
      ORDER BY tp.store_id
    `);
    console.log('\n🏪 Stores with TopUp Products:');
    topupStores.rows.forEach(s => console.log(`  - Store ID: ${s.store_id}, Name: ${s.store_name}`));

    // Get companies for each store with topup products
    for (const row of topupStores.rows) {
      const companies = await pool.query(
        'SELECT id, name FROM topup_companies WHERE store_id = $1',
        [row.store_id]
      );
      console.log(`\n🏢 Store ID ${row.store_id} - Companies: ${companies.rows.length}`);
      companies.rows.forEach(c => console.log(`    - ${c.name}`));

      // Also get products count
      const products = await pool.query(
        'SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1',
        [row.store_id]
      );
      console.log(`   Products: ${products.rows[0].count}`);
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
