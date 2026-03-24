const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Hp123456',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

(async () => {
  try {
    console.log('🚀 إنشاء منتج تجريبي مع المزاد...');
    
    const productRes = await pool.query(
      `INSERT INTO products (
        store_id, category_id, name, description, price, stock, 
        image_url, is_auction, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, name, is_auction`,
      [5, 1, '🎯 منتج تجريبي مزاد', 'منتج لاختبار المزادات', 50000, 10, 'https://via.placeholder.com/300', true, true]
    );

    const productId = productRes.rows[0].id;
    console.log('✅ تم إنشاء المنتج:');
    console.log('   - المعرف:', productId);
    console.log('   - الاسم:', productRes.rows[0].name);
    console.log('   - هو مزاد:', productRes.rows[0].is_auction);

    const auctionRes = await pool.query(
      `INSERT INTO auctions (
        product_id, store_id, auction_date, auction_start_time, 
        auction_end_time, starting_price, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
      RETURNING id, product_id, auction_date, status`,
      [productId, 5, '2026-03-21', '09:00:00', '21:00:00', 50000, 'active']
    );

    console.log('\n✅ تم إنشاء المزاد:');
    console.log('   - معرف المزاد:', auctionRes.rows[0].id);
    console.log('   - معرف المنتج:', auctionRes.rows[0].product_id);
    console.log('   - التاريخ:', auctionRes.rows[0].auction_date);
    console.log('   - الحالة:', auctionRes.rows[0].status);
    
    console.log('\n✨ تم إنشاء المنتج والمزاد بنجاح!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
})();
