import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:postgres@localhost/multi_ecommerce'
});

async function createAuctionForProduct17() {
  try {
    console.log('📦 Creating auction for product 17...\n');
    
    // First check the product
    const productRes = await pool.query('SELECT * FROM products WHERE id = 17');
    if (productRes.rows.length === 0) {
      console.log('❌ Product 17 not found');
      return;
    }
    
    const product = productRes.rows[0];
    console.log('✅ Found product:', product.name);
    console.log('   Store ID:', product.store_id);
    
    // Create auction
    const today = new Date();
    const auctionDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const result = await pool.query(`
      INSERT INTO auctions (product_id, store_id, start_time, end_time, starting_price, current_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `, [
      product.id,
      product.store_id,
      `${auctionDate} 10:00:00`,      // Start at 10 AM
      `${auctionDate} 18:00:00`,      // End at 6 PM
      25000,                           // Starting price
      0                                // Current price
    ]);
    
    console.log('\n✅ Auction created:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Start:', result.rows[0].start_time);
    console.log('   End:', result.rows[0].end_time);
    console.log('   Price:', result.rows[0].starting_price);
    
    // Update product to link auction
    await pool.query(
      'UPDATE products SET auction_id = $1, is_auction = true WHERE id = $2',
      [result.rows[0].id, product.id]
    );
    
    console.log('\n✅ Product 17 linked to auction', result.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAuctionForProduct17();
