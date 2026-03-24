import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function main() {
  try {
    const stores = await pool.query('SELECT id, name, store_type FROM stores LIMIT 5');
    console.log('📦 Stores:', stores.rows);
    
    const products = await pool.query('SELECT id, name, store_id, is_auction FROM products LIMIT 3');
    console.log('🛍️ Products:', products.rows);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
