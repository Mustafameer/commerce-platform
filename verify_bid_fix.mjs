import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  // Try to insert a bid with bidder_id = NULL (for anonymous bids) and customer_id = NULL
  const result = await pool.query(`
    INSERT INTO auction_bids (auction_id, bidder_id, customer_id, bid_amount, customer_name, customer_phone, bid_price)
    VALUES (1, NULL, NULL, 60000, 'محمد علي', '07812141144', 60000)
    RETURNING *
  `);
  
  console.log('✅ Bid inserted successfully!');
  console.log('Bid details:');
  const bid = result.rows[0];
  console.log('  ID:', bid.id);
  console.log('  Auction ID:', bid.auction_id);
  console.log('  Bidder ID:', bid.bidder_id);
  console.log('  Customer ID:', bid.customer_id);
  console.log('  Amount:', bid.bid_amount);
  console.log('  Name:', bid.customer_name);
  console.log('  Phone:', bid.customer_phone);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await pool.end();
}
