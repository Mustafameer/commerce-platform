import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function main() {
  try {
    // Get all stores
    const storesRes = await pool.query('SELECT id, name, store_type FROM stores LIMIT 10');
    console.log('📦 Available Stores:');
    storesRes.rows.forEach(s => {
      console.log(`   ID: ${s.id}, Name: ${s.name}, Type: ${s.store_type}`);
    });
    
    console.log('\n');

    // Use the first regular store (not topup)
    const regularStore = storesRes.rows.find(s => s.store_type !== 'topup');
    if (!regularStore) {
      console.log('❌ No regular store found');
      return;
    }

    console.log(`✅ Using store: ID=${regularStore.id}, Name=${regularStore.name}`);

    // Get first category
    const catRes = await pool.query('SELECT id FROM categories LIMIT 1');
    const category_id = catRes.rows[0]?.id;
    console.log(`✅ Using category: ID=${category_id}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
