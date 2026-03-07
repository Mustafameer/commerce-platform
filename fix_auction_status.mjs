import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  // Update all pending auctions to active
  const result = await pool.query(`
    UPDATE auctions 
    SET status = 'active' 
    WHERE status = 'pending'
    RETURNING *
  `);
  
  console.log('Updated auctions:', result.rows.length);
  console.log('Auctions updated:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  // Verify
  const verify = await pool.query(`SELECT COUNT(*) as count FROM auctions WHERE status = 'active'`);
  console.log('\nActive auctions now:', verify.rows[0].count);
  
  pool.end();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
