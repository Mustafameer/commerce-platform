import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function createTestAuction() {
  try {
    // Create a test product first
    console.log('📦 Creating test product...');
    const productRes = await pool.query(`
      INSERT INTO products (
        store_id, name, description, price, stock, 
        image_url, is_active, category_id, is_auction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      5, // store_id
      'منتج مزاد تجريبي', // name
      'هذا منتج تجريبي للمزاد', // description
      50000, // price
      10, // stock
      '/uploads/products/test.jpg', // image_url
      true, // is_active
      1, // category_id
      true // is_auction
    ]);

    const productId = productRes.rows[0].id;
    console.log('✅ Product created with ID:', productId);

    // Now create an auction for this product
    console.log('\n🏆 Creating auction...');
    
    // Set auction for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const auctionDate = tomorrow.toISOString().split('T')[0];
    
    const auctionRes = await pool.query(`
      INSERT INTO auctions (
        product_id, store_id, auction_date, 
        auction_start_time, auction_end_time, 
        starting_price, current_highest_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      productId, // product_id
      5, // store_id
      auctionDate, // auction_date (tomorrow)
      '09:00', // auction_start_time
      '18:00', // auction_end_time
      50000, // starting_price
      50000, // current_highest_price
      'active' // status
    ]);

    const auctionId = auctionRes.rows[0].id;
    console.log('✅ Auction created with ID:', auctionId);

    // Update product with auction_id
    console.log('\n🔗 Linking auction to product...');
    await pool.query('UPDATE products SET auction_id = $1 WHERE id = $2', [auctionId, productId]);
    console.log('✅ Product linked to auction');

    console.log('\n\n🎉 Test auction created successfully!');
    console.log('You can now see it in the auctions section on the homepage.');
    
    // Show the created auction
    const auctionData = await pool.query('SELECT * FROM auctions WHERE id = $1', [auctionId]);
    console.log('\n📋 Auction details:');
    console.log(JSON.stringify(auctionData.rows[0], null, 2));

    pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    pool.end();
  }
}

createTestAuction();
