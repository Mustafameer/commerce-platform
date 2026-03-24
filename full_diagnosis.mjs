import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function fullDiagnosis() {
  try {
    await client.connect();
    console.log('🔍 COMPLETE DATABASE DIAGNOSIS\n');

    // 1. Check products table schema
    console.log('=' .repeat(80));
    console.log('1️⃣ Products Table Schema:\n');
    
    const schemaRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    console.log(`Total columns: ${schemaRes.rows.length}\n`);
    schemaRes.rows.forEach(col => {
      const isAuction = col.column_name.includes('auction') || col.column_name === 'is_auction';
      const marker = isAuction ? '🎯' : '  ';
      console.log(`${marker} ${col.column_name.padEnd(25)} (${col.data_type.padEnd(30)} nullable: ${col.is_nullable})`);
    });
    
    const auctionCols = schemaRes.rows.filter(c => c.column_name.includes('auction') || c.column_name === 'is_auction');
    console.log(`\n🎯 Auction-related columns found: ${auctionCols.length}`);
    auctionCols.forEach(col => {
      console.log(`   ✓ ${col.column_name}`);
    });

    // 2. Count products
    console.log('\n' + '=' .repeat(80));
    console.log('2️⃣ Products Count:\n');
    
    const countRes = await client.query('SELECT COUNT(*) as total FROM products');
    console.log(`Total products: ${countRes.rows[0].total}\n`);

    // 3. Check products with is_auction
    console.log('=' .repeat(80));
    console.log('3️⃣ Products with is_auction = TRUE:\n');
    
    const auctionRes = await client.query(`
      SELECT id, name, is_auction
      FROM products
      WHERE is_auction = true
      LIMIT 20
    `);
    
    console.log(`Found: ${auctionRes.rows.length}\n`);
    if (auctionRes.rows.length > 0) {
      auctionRes.rows.forEach(row => {
        console.log(`   ✓ Product ${row.id}: ${row.name} (is_auction: ${row.is_auction})`);
      });
    } else {
      console.log('   ℹ️ No auction products found');
    }

    // 4. Check auction data columns
    console.log('\n' + '=' .repeat(80));
    console.log('4️⃣ Sample Products with Auction Data:\n');
    
    const dataRes = await client.query(`
      SELECT 
        id, name, is_auction,
        auction_date, auction_start_time, auction_end_time, auction_price
      FROM products
      WHERE is_auction = true
      LIMIT 10
    `);
    
    console.log(`Found: ${dataRes.rows.length}\n`);
    if (dataRes.rows.length > 0) {
      dataRes.rows.forEach((row, index) => {
        console.log(`${index + 1}. Product ${row.id}: ${row.name}`);
        console.log(`   is_auction: ${row.is_auction}`);
        console.log(`   Date: ${row.auction_date || 'NULL'}`);
        console.log(`   Time: ${row.auction_start_time || 'NULL'} - ${row.auction_end_time || 'NULL'}`);
        console.log(`   Price: ${row.auction_price || 'NULL'}\n`);
      });
    } else {
      console.log('   ℹ️ No auction products with data');
    }

    // 5. Check all data
    console.log('=' .repeat(80));
    console.log('5️⃣ First 10 Products (Full Details):\n');
    
    const allRes = await client.query(`
      SELECT id, name, is_auction, auction_date, auction_price
      FROM products
      LIMIT 10
    `);
    
    allRes.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ID: ${row.id}, Name: ${row.name}`);
      console.log(`   is_auction: ${row.is_auction}, Price: ${row.auction_price}, Date: ${row.auction_date}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

fullDiagnosis();
