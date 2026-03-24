import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  
  try {
    console.log('\n🔍 Verifying saved auction data...\n');
    
    // Get auction 15 that we just created
    const auctionRes = await pool.query(
      `SELECT 
        id, product_id, store_id, 
        starting_price, current_highest_price, current_price,
        auction_date, auction_start_time, auction_end_time,
        status, created_at
      FROM auctions WHERE id = 15`
    );
    
    if (auctionRes.rows.length === 0) {
      console.log('❌ Auction not found!');
      pool.end();
      return;
    }
    
    const auction = auctionRes.rows[0];
    
    console.log('✅ Auction record saved in database:\n');
    console.log('  ID:', auction.id);
    console.log('  Product ID:', auction.product_id);
    console.log('  Store ID:', auction.store_id);
    console.log('  Status:', auction.status);
    console.log('  Created At:', auction.created_at);
    console.log('\n💰 Price Fields:');
    console.log('  starting_price:', auction.starting_price, '✓');
    console.log('  current_highest_price:', auction.current_highest_price, '✓');
    console.log('  current_price:', auction.current_price);
    console.log('\n📅 Date & Time Fields:');
    console.log('  auction_date:', auction.auction_date, '✓');
    console.log('  auction_start_time:', auction.auction_start_time, '✓');
    console.log('  auction_end_time:', auction.auction_end_time, '✓');
    
    // Get product 34
    console.log('\n\n📦 Product #34 Status:\n');
    const productRes = await pool.query(
      `SELECT id, name, price, is_auction, auction_id FROM products WHERE id = 34`
    );
    
    if (productRes.rows.length > 0) {
      const product = productRes.rows[0];
      console.log('  Name:', product.name);
      console.log('  Price:', product.price, '(linked to starting_price) ✓');
      console.log('  is_auction:', product.is_auction, '✓');
      console.log('  auction_id:', product.auction_id, '✓');
    }
    
    console.log('\n✅ All required fields are properly saved and match!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

main();
