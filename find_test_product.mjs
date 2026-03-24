import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  
  try {
    // Get stats
    console.log('\n📊 Database Statistics:\n');
    
    const storesRes = await pool.query("SELECT COUNT(*) as count FROM stores WHERE store_type != 'topup'");
    console.log(`  📍 Regular Stores: ${storesRes.rows[0].count}`);
    
    const productsRes = await pool.query("SELECT COUNT(*) as count FROM products WHERE is_auction = false");
    console.log(`  📦 Non-Auction Products: ${productsRes.rows[0].count}`);
    
    // Get first regular store
    const storeRes = await pool.query("SELECT id, name FROM stores WHERE store_type != 'topup' LIMIT 1");
    
    if (storeRes.rows.length === 0) {
      console.log('\n❌ No regular stores found!');
      pool.end();
      return;
    }
    
    const store = storeRes.rows[0];
    console.log(`\n🏪 Using Store #${store.id}: ${store.store_name}\n`);
    
    // Get products from this store that are not auctions
    const productsRes2 = await pool.query(
      'SELECT id, name, price, is_auction FROM products WHERE store_id = $1 AND is_auction = false LIMIT 5',
      [store.id]
    );
    
    if (productsRes2.rows.length === 0) {
      console.log('❌ No products available in this store!');
      pool.end();
      return;
    }
    
    console.log('📦 Available Products:\n');
    productsRes2.rows.forEach(p => {
      console.log(`  Product #${p.id}`);
      console.log(`    Name: ${p.name}`);
      console.log(`    Price: ${p.price} ريال`);
      console.log(`    Is Auction: ${p.is_auction}\n`);
    });
    
    console.log(`\n💡 Usage Example:`);
    console.log(`  node convert_product_to_auction.mjs ${productsRes2.rows[0].id} 2026-03-22 10:00 18:00\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

main();
