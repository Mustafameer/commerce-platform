import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  const result = await pool.query(`
    SELECT 
      a.*,
      p.name as product_name,
      s.store_name,
      COUNT(ab.id) as total_bids
    FROM auctions a
    LEFT JOIN products p ON a.product_id = p.id
    LEFT JOIN stores s ON a.store_id = s.id
    LEFT JOIN auction_bids ab ON a.id = ab.auction_id
    GROUP BY a.id, p.id, s.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `);
  console.log('Auctions in database:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  const activeResult = await pool.query(`SELECT * FROM auctions WHERE status = 'active'`);
  console.log('\nActive auctions:', activeResult.rows.length);
  
  const allResult = await pool.query(`SELECT * FROM auctions`);
  console.log('Total auctions:', allResult.rows.length);
  
  pool.end();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
