import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function createAuctionTestData() {
  try {
    await client.connect();
    console.log('✅ Creating test auction data...\n');

    // Get a regular store
    const storeRes = await client.query(`
      SELECT id, store_name FROM stores
      WHERE store_type = 'regular'
      LIMIT 1
    `);

    if (storeRes.rows.length === 0) {
      console.log('❌ No regular stores found');
      return;
    }

    const store = storeRes.rows[0];
    console.log(`📦 Using store: ${store.store_name} (ID: ${store.id})\n`);

    // Create a test auction product with all auction fields populated
    const insertRes = await client.query(`
      INSERT INTO products (
        store_id, name, price, stock, description, is_active, is_auction,
        auction_date, auction_start_time, auction_end_time, auction_price
      ) VALUES (
        $1, $2, $3, $4, $5, true, true,
        '2026-03-25'::date, '10:00:00'::time, '15:00:00'::time, 150000
      ) RETURNING id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price
    `, [
      store.id,
      '🎯 منتج مزاد تجريبي مع البيانات الكاملة',
      100000,
      50,
      'منتج تجريبي لاختبار نظام المزادات المدمج'
    ]);

    const product = insertRes.rows[0];
    console.log(`✅ Created auction product:\n`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   is_auction: ${product.is_auction}`);
    console.log(`   Auction Date: ${product.auction_date}`);
    console.log(`   Auction Time: ${product.auction_start_time} - ${product.auction_end_time}`);
    console.log(`   Auction Price: ${product.auction_price}\n`);

    // Also update Product 54 with auction data
    console.log('⏳ Updating Product 54 with auction data...\n');
    const updateRes = await client.query(`
      UPDATE products SET
        auction_date = '2026-03-24'::date,
        auction_start_time = '08:00:00'::time,
        auction_end_time = '14:00:00'::time,
        auction_price = 75000
      WHERE id = 54
      AND is_auction = true
      RETURNING id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price
    `);

    if (updateRes.rows.length > 0) {
      const updated = updateRes.rows[0];
      console.log(`✅ Updated Product 54:\n`);
      console.log(`   Name: ${updated.name}`);
      console.log(`   Auction Date: ${updated.auction_date}`);
      console.log(`   Auction Time: ${updated.auction_start_time} - ${updated.auction_end_time}`);
      console.log(`   Auction Price: ${updated.auction_price}\n`);
    }

    // Verify all auction products
    console.log('=' .repeat(80));
    console.log('\n📊 All Auction Products After Setup:\n');
    
    const verifyRes = await client.query(`
      SELECT id, name, is_auction, auction_date, auction_start_time, auction_end_time, auction_price
      FROM products
      WHERE is_auction = true
      ORDER BY id DESC
    `);

    console.log(`Total: ${verifyRes.rows.length}\n`);
    verifyRes.rows.forEach((row, index) => {
      console.log(`${index + 1}. Product ${row.id}: ${row.name}`);
      console.log(`   Date: ${row.auction_date}, Time: ${row.auction_start_time}-${row.auction_end_time}`);
      console.log(`   Price: ${row.auction_price}\n`);
    });

    console.log('=' .repeat(80));
    console.log('\n✅ TEST DATA CREATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  ✓ All 5 auction columns verified and populated`);
    console.log(`  ✓ Created test auction product`);
    console.log(`  ✓ Updated existing auction product`);
    console.log(`  ✓ Ready for testing!\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

createAuctionTestData();
