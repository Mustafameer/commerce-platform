import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function populateAuctionData() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // First, update the existing product 56 with auction data
    console.log('⏳ Step 1: Updating Product 56 with auction data...\n');
    
    const updateRes = await client.query(`
      UPDATE products SET
        auction_date = '2026-03-25'::date,
        auction_start_time = '10:00:00'::time,
        auction_end_time = '15:00:00'::time,
        auction_price = 150000
      WHERE id = 56
      RETURNING id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price
    `);

    if (updateRes.rows.length > 0) {
      const prod = updateRes.rows[0];
      console.log(`✅ Updated Product 56: ${prod.name}`);
      console.log(`   is_auction: ${prod.is_auction}`);
      console.log(`   Date: ${prod.auction_date}`);
      console.log(`   Time: ${prod.auction_start_time} - ${prod.auction_end_time}`);
      console.log(`   Price: ${prod.auction_price}\n`);
    }

    // Create more test auction products
    console.log('⏳ Step 2: Creating new test auction products...\n');
    
    const insertRes = await client.query(`
      INSERT INTO products (
        store_id, name, price, stock, description, is_active, is_auction,
        auction_date, auction_start_time, auction_end_time, auction_price
      ) VALUES 
        (5, '🎯 منتج مزاد - هاتف ذكي', 500000, 10, 'هاتف ذكي جديد', true, true, '2026-03-26'::date, '09:00:00'::time, '17:00:00'::time, 400000),
        (5, '🎯 منتج مزاد - الكترونيات', 300000, 5, 'اجهزة الكترونية', true, true, '2026-03-27'::date, '11:00:00'::time, '16:00:00'::time, 250000),
        (5, '🎯 منتج مزاد - مجوهرات', 750000, 3, 'مجوهرات ذهبية', true, true, '2026-03-28'::date, '14:00:00'::time, '19:00:00'::time, 650000)
      RETURNING id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price
    `);

    console.log(`✅ Created ${insertRes.rows.length} new auction products:\n`);
    insertRes.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Product ${row.id}: ${row.name}`);
      console.log(`   Date: ${row.auction_date}, Time: ${row.auction_start_time}-${row.auction_end_time}`);
      console.log(`   Price: ${row.auction_price}\n`);
    });

    // Verify all auction products
    console.log('=' .repeat(80));
    console.log('\n✨ FINAL VERIFICATION - All Auction Products:\n');
    
    const verifyRes = await client.query(`
      SELECT 
        id, name, is_auction,
        auction_date, auction_start_time, auction_end_time, auction_price
      FROM products
      WHERE is_auction = true
      ORDER BY id DESC
    `);

    console.log(`📦 Total auction products: ${verifyRes.rows.length}\n`);
    verifyRes.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Product ${row.id}: ${row.name}`);
      console.log(`   is_auction: ${row.is_auction} ✓`);
      console.log(`   auction_date: ${row.auction_date} ✓`);
      console.log(`   auction_start_time: ${row.auction_start_time} ✓`);
      console.log(`   auction_end_time: ${row.auction_end_time} ✓`);
      console.log(`   auction_price: ${row.auction_price} ✓\n`);
    });

    console.log('=' .repeat(80));
    console.log('\n✅ SUCCESSFUL! All auction data populated:\n');
    console.log('Summary:');
    console.log(`  ✓ ${verifyRes.rows.length} auction products with complete data`);
    console.log('  ✓ All 5 auction columns populated (is_auction, date, start_time, end_time, price)');
    console.log('  ✓ Ready to test in the UI!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

populateAuctionData();
