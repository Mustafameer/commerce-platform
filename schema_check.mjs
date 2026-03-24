import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function main() {
  try {
    // Check stores schema
    const storesSchema = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'stores'
    `);
    console.log('📋 Stores Schema:');
    storesSchema.rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type}`));
    
    // Get all stores
    const stores = await pool.query('SELECT * FROM stores LIMIT 3');
    console.log('\n📦 Stores Count:', stores.rowCount);
    if (stores.rowCount > 0) {
      console.log('   First store:', stores.rows[0]);
    }
    
    // Get all products
    const products = await pool.query('SELECT id, store_id, is_auction FROM products LIMIT 3');
    console.log('\n🛍️ Products Count:', products.rowCount);
    if (products.rowCount > 0) {
      console.log('   First product:', products.rows[0]);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
