const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

pool.query('SELECT id, name, price, bulk_price FROM products LIMIT 10', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Products found:');
    res.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name || '[EMPTY]'}, Price: ${row.price}, Bulk: ${row.bulk_price}`);
    });
  }
  pool.end();
});
