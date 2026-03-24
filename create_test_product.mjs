import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  
  try {
    console.log('\n📝 Creating test product for auction conversion...\n');
    
    // Create a new product in store 5
    const result = await pool.query(`
      INSERT INTO products (
        store_id, name, description, price, stock_quantity, is_active, is_auction, created_at
      ) VALUES (
        5,
        'منتج تجريبي للمزاد',
        'منتج تجريبي لاختبار عملية التحويل إلى مزاد',
        50000,
        10,
        TRUE,
        FALSE,
        NOW()
      )
      RETURNING id, name, price, is_auction
    `);
    
    const product = result.rows[0];
    console.log('✅ Product created successfully!\n');
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Name: ${product.name}`);
    console.log(`  Price: ${product.price} ريال`);
    console.log(`  Is Auction: ${product.is_auction}`);
    
    console.log(`\n💡 Usage: node convert_product_to_auction.mjs ${product.id} 2026-03-22 10:00 18:00\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

main();
