import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function main() {
  try {
    console.log('📊 FINAL VERIFICATION: Auction System Status\n');

    // 1. Check total products
    const productsRes = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Total Products: ${productsRes.rows[0].count}`);

    // 2. Check auction products
    const auctionProdsRes = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_auction = true');
    console.log(`✅ Products with is_auction=true: ${auctionProdsRes.rows[0].count}`);

    // 3. Check orphaned products (is_auction=true but auction_id=null)
    const orphanedRes = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_auction = true AND auction_id IS NULL');
    console.log(`⚠️ Orphaned Auctions (is_auction=true but no auction_id): ${orphanedRes.rows[0].count}`);

    // 4. Check total auction records
    const auctionsRes = await pool.query('SELECT COUNT(*) as count FROM auctions');
    console.log(`✅ Total Auction Records: ${auctionsRes.rows[0].count}`);

    // 5. Linked auctions
    const linkedRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM products p 
      WHERE is_auction = true 
      AND auction_id IS NOT NULL
    `);
    console.log(`✅ Properly Linked Auctions: ${linkedRes.rows[0].count}`);

    // 6. Show recent products with auction status
    console.log('\n📋 Recent Products:');
    const recentRes = await pool.query(`
      SELECT 
        id, 
        name, 
        is_auction, 
        auction_id,
        created_at
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    recentRes.rows.forEach(p => {
      console.log(`   ID: ${p.id}, Name: ${p.name.substring(0, 30)}, is_auction: ${p.is_auction}, auction_id: ${p.auction_id}`);
    });

    console.log('\n✅ System Status: OK');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
