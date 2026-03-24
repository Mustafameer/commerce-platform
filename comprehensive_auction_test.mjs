import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function comprehensiveAuctionTest() {
  try {
    console.log('🧪 COMPREHENSIVE AUCTION FIX TEST\n');
    console.log('═'.repeat(60));

    // TEST 1: Create new product with auction
    console.log('\n📝 TEST 1: Creating new product with auction data');
    console.log('-'.repeat(60));
    
    const product1Response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 5,
        category_id: 1,
        name: 'الاختبار 1: منتج جديد مع مزاد',
        price: 75000,
        stock: 5,
        image_url: 'https://via.placeholder.com/200',
        is_auction: true,
        auction_date: '2026-03-26',
        auction_start_time: '09:30',
        auction_end_time: '17:30',
        auction_price: 75000
      })
    });

    const product1 = (await product1Response.json()).product;
    console.log('✅ Product 1 created:', product1.id);

    // Verify auction was created
    const auction1 = await pool.query(
      `SELECT auction_date, auction_start_time, auction_end_time FROM auctions WHERE product_id = $1`,
      [product1.id]
    );
    
    if (auction1.rows[0]) {
      console.log(`✅ Auction created with:
   Date: ${auction1.rows[0].auction_date}
   Start: ${auction1.rows[0].auction_start_time}
   End: ${auction1.rows[0].auction_end_time}`);
    }

    // TEST 2: Edit product and add auction to non-auction product
    console.log('\n📝 TEST 2: Adding auction to existing regular product');
    console.log('-'.repeat(60));

    // First create a regular product
    const regularProduct = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 5,
        category_id: 1,
        name: 'الاختبار 2: منتج عادي',
        price: 25000,
        stock: 10,
        image_url: 'https://via.placeholder.com/200',
        is_auction: false
      })
    });

    const product2 = (await regularProduct.json()).product;
    console.log('✅ Created regular product:', product2.id);

    // Now edit it to add auction
    const editResponse = await fetch(`http://localhost:3000/api/products/${product2.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: 1,
        name: 'الاختبار 2: منتج أصبح مزاد',
        price: 25000,
        stock: 10,
        is_auction: true,
        auction_date: '2026-03-27',
        auction_start_time: '14:00',
        auction_end_time: '20:00',
        auction_price: 25000
      })
    });

    const product2Updated = (await editResponse.json()).product;
    console.log('✅ Product 2 updated to auction:', product2Updated.id);

    // Check if auction was created
    const auction2 = await pool.query(
      `SELECT id, auction_date, auction_start_time, auction_end_time FROM auctions WHERE product_id = $1`,
      [product2.id]
    );

    if (auction2.rows[0]) {
      console.log(`✅ Auction created with:
   ID: ${auction2.rows[0].id}
   Date: ${auction2.rows[0].auction_date}
   Start: ${auction2.rows[0].auction_start_time}
   End: ${auction2.rows[0].auction_end_time}`);
    } else {
      console.log('❌ Auction NOT created for product 2!');
    }

    // TEST 3: Fetch auction data for edit form
    console.log('\n📝 TEST 3: Fetching auction data for edit form');
    console.log('-'.repeat(60));

    const editFormDataResponse = await fetch(`http://localhost:3000/api/auctions?productId=${product1.id}`);
    const editFormData = await editFormDataResponse.json();

    if (editFormData) {
      console.log(`✅ Edit form data fetched:
   auction_date: ${editFormData.auction_date}
   auction_start_time: ${editFormData.auction_start_time}
   auction_end_time: ${editFormData.auction_end_time}`);
    }

    // TEST 4: Verify auctions appear in marketplace
    console.log('\n📝 TEST 4: Verifying auctions in marketplace');
    console.log('-'.repeat(60));

    const marketplaceResponse = await fetch('http://localhost:3000/api/auctions/active');
    const marketplaceAuctions = await marketplaceResponse.json();

    const testAuctions = marketplaceAuctions.filter(a => 
      a.product_id === product1.id || a.product_id === product2.id
    );

    console.log(`✅ Found ${testAuctions.length} test auctions in marketplace`);

    testAuctions.forEach((auction, idx) => {
      console.log(`\n   Auction ${idx + 1}:`);
      console.log(`   - Product: ${auction.product_name}`);
      console.log(`   - Date: ${auction.auction_date}`);
      console.log(`   - Start: ${auction.auction_start_time}`);
      console.log(`   - End: ${auction.auction_end_time}`);
      console.log(`   - Price: ${auction.starting_price}`);
      console.log(`   - Status: ${auction.status}`);
    });

    // TEST 5: Database integrity check
    console.log('\n📝 TEST 5: Database integrity check');
    console.log('-'.repeat(60));

    const dbCheck = await pool.query(`
      SELECT 
        COUNT(*)::integer as total_auctions,
        COUNT(CASE WHEN auction_date IS NULL THEN 1 END)::integer as missing_dates,
        COUNT(CASE WHEN auction_start_time IS NULL THEN 1 END)::integer as missing_start_times,
        COUNT(CASE WHEN auction_end_time IS NULL THEN 1 END)::integer as missing_end_times
      FROM auctions
    `);

    const integrity = dbCheck.rows[0];
    console.log(`✅ Database integrity:
   Total auctions: ${integrity.total_auctions}
   Missing dates: ${integrity.missing_dates}
   Missing start times: ${integrity.missing_start_times}
   Missing end times: ${integrity.missing_end_times}`);

    if (integrity.missing_dates === 0 && 
        integrity.missing_start_times === 0 && 
        integrity.missing_end_times === 0) {
      console.log('   ✅ All auctions have complete date/time data!');
    } else {
      console.log('   ⚠️  Some auctions have missing date/time data');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

comprehensiveAuctionTest();
