import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'multi_ecommerce',
  password: '654301',
  port: 5432,
});

async function checkAuctionData() {
  try {
    const result = await pool.query(
      `SELECT id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price 
       FROM products 
       WHERE store_id = 5 AND is_auction = true 
       ORDER BY id DESC 
       LIMIT 3`
    );

    console.log('🔍 حالة بيانات المزاد الحالية:\n');
    result.rows.forEach(p => {
      console.log(`📦 Product ID: ${p.id}`);
      console.log(`   Name: ${p.name}`);
      console.log(`   is_auction: ${p.is_auction}`);
      console.log(`   auction_date: ${p.auction_date}`);
      console.log(`   auction_start_time: ${p.auction_start_time}`);
      console.log(`   auction_end_time: ${p.auction_end_time}`);
      console.log(`   auction_price: ${p.auction_price}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAuctionData();
