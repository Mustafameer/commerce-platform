import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

try {
  const result = await pool.query('SELECT id, store_name FROM stores');
  console.log('✓ Stores found:', result.rows.length);
  result.rows.forEach(row => {
    console.log(`  - ${row.store_name} (ID: ${row.id})`);
  });
} catch (e) {
  console.log('✗ Error:', e.message);
} finally {
  await pool.end();
}
