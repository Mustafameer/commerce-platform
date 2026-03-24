import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

try {
  // Verify the columns now exist
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'auctions' 
    AND column_name IN ('current_highest_price', 'winner_id')
    ORDER BY ordinal_position
  `);
  
  console.log('✅ Auctions table now has these columns:');
  result.rows.forEach(c => {
    console.log(`  ✓ ${c.column_name}`);
  });
  
  if (result.rows.length === 2) {
    console.log('\n✅ All required columns are present!');
  } else {
    console.log('\n⚠️  Missing some columns. Check migrations.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
