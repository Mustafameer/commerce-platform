import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  
  try {
    console.log('\n🔍 Checking products in the database...\n');
    
    // Get total products
    const countRes = await pool.query("SELECT COUNT(*) as total FROM products");
    console.log(`Total products: ${countRes.rows[0].total}`);
    
    // Get one product to see fields
    const oneRes = await pool.query("SELECT * FROM products LIMIT 1");
    
    if (oneRes.rows.length === 0) {
      console.log('❌ No products found in database!');
      pool.end();
      return;
    }
    
    const product = oneRes.rows[0];
    console.log('\n📦 Sample Product #' + product.id);
    console.log('Fields:', Object.keys(product).join(', '));
    
    // Get non-auction products from store 5
    const store5 = await pool.query(
      "SELECT id FROM products WHERE store_id = 5 AND is_auction = false LIMIT 1"
    );
    
    if (store5.rows.length > 0) {
      console.log(`\n✅ Found non-auction product #${store5.rows[0].id} from store 5`);
      console.log(`\n💡 Usage: node convert_product_to_auction.mjs ${store5.rows[0].id} 2026-03-22 10:00 18:00`);
    } else {
      console.log('\n❌ No non-auction products available');
      // Try to find ANY product from store 5
      const any = await pool.query("SELECT id, is_auction FROM products WHERE store_id = 5 LIMIT 3");
      console.log(`\nProducts in store 5: ${any.rows.length}`);
      any.rows.forEach(p => {
        console.log(`  #${p.id} - is_auction: ${p.is_auction}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

main();
