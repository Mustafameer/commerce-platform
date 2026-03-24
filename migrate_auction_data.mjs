import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function migrateAuctionData() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check existing auction data
    console.log('📋 Step 1: Checking existing auction data...\n');
    
    const auctionsRes = await client.query(`
      SELECT id, product_id, auction_date, auction_start_time, auction_end_time, starting_price
      FROM auctions
      LIMIT 10
    `);
    
    console.log(`Found ${auctionsRes.rows.length} auction records:\n`);
    auctionsRes.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Product: ${row.product_id}`);
      console.log(`    Date: ${row.auction_date}, Time: ${row.auction_start_time}-${row.auction_end_time}`);
      console.log(`    Price: ${row.starting_price}\n`);
    });

    // Step 2: Migrate data from auctions table to products columns
    console.log('=' .repeat(80));
    console.log('\n🔄 Step 2: Migrating auction data to products table...\n');
    
    const updateRes = await client.query(`
      UPDATE products p
      SET 
        auction_date = a.auction_date,
        auction_start_time = a.auction_start_time,
        auction_end_time = a.auction_end_time,
        auction_price = a.starting_price
      FROM auctions a
      WHERE a.product_id = p.id
      AND p.is_auction = true
      RETURNING p.id, p.name, p.auction_date, p.auction_start_time, p.auction_end_time, p.auction_price
    `);
    
    console.log(`✅ Migrated ${updateRes.rows.length} products:\n`);
    updateRes.rows.forEach(row => {
      console.log(`  ✓ Product ${row.id}: ${row.name}`);
      console.log(`    Date: ${row.auction_date}, Time: ${row.auction_start_time}-${row.auction_end_time}`);
      console.log(`    Price: ${row.auction_price}\n`);
    });

    // Step 3: Verify migration
    console.log('=' .repeat(80));
    console.log('\n✨ Step 3: Verifying migrated data...\n');
    
    const verifyRes = await client.query(`
      SELECT 
        id,
        name,
        is_auction,
        auction_date,
        auction_start_time,
        auction_end_time,
        auction_price
      FROM products
      WHERE is_auction = true
      AND auction_date IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log(`✅ Verified ${verifyRes.rows.length} auction products with data:\n`);
    verifyRes.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Product ID: ${row.id}`);
      console.log(`     Name: ${row.name}`);
      console.log(`     is_auction: ${row.is_auction}`);
      console.log(`     Date: ${row.auction_date}`);
      console.log(`     Time: ${row.auction_start_time} - ${row.auction_end_time}`);
      console.log(`     Price: ${row.auction_price}\n`);
    });

    console.log('=' .repeat(80));
    console.log('\n✅ MIGRATION COMPLETE!\n');
    console.log('Summary:');
    console.log(`  ✓ ${updateRes.rows.length} auction products migrated`);
    console.log(`  ✓ Data copied from auctions table to products columns`);
    console.log(`  ✓ All auction fields now populated in products table\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

migrateAuctionData();
