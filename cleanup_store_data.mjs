import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function deleteStoreData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding store: علي الهادي...');
    
    // Find the store
    const storeResult = await client.query(`
      SELECT id, store_name, owner_name FROM stores 
      WHERE store_name ILIKE $1 OR owner_name ILIKE $1
    `, ['علي الهادي']);
    
    if (storeResult.rows.length === 0) {
      console.log('❌ Store not found: علي الهادي');
      console.log('\nℹ️  Available stores:');
      const allStores = await client.query(`SELECT id, store_name, owner_name FROM stores WHERE is_active = true`);
      allStores.rows.forEach(s => {
        console.log(`   ID: ${s.id}, Name: ${s.store_name}, Owner: ${s.owner_name}`);
      });
      return;
    }
    
    const store = storeResult.rows[0];
    console.log(`✅ Found store: ${store.store_name} (ID: ${store.id}, Owner: ${store.owner_name})`);
    
    // Get counts before deletion
    const productsCount = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE store_id = $1
    `, [store.id]);
    
    const categoriesCount = await client.query(`
      SELECT COUNT(*) as count FROM categories WHERE store_id = $1
    `, [store.id]);
    
    console.log(`\n📊 Items to delete:`);
    console.log(`   - Products: ${productsCount.rows[0].count}`);
    console.log(`   - Categories: ${categoriesCount.rows[0].count}`);
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Delete products first (products may reference categories)
      const delProductsResult = await client.query(`
        DELETE FROM products 
        WHERE store_id = $1
        RETURNING id
      `, [store.id]);
      
      console.log(`\n🗑️  Deleted ${delProductsResult.rows.length} products`);
      
      // Delete categories
      const delCategoriesResult = await client.query(`
        DELETE FROM categories 
        WHERE store_id = $1
        RETURNING id
      `, [store.id]);
      
      console.log(`🗑️  Deleted ${delCategoriesResult.rows.length} categories`);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`\n✅ Successfully deleted all products and categories for: ${store.store_name}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteStoreData()
  .then(() => {
    console.log('\n✨ Cleanup completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
