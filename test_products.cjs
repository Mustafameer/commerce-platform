const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

pool.query("SELECT id, name, price, wholesale_price, description FROM products WHERE is_active = true LIMIT 5", (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else if (res.rows.length > 0) {
    console.log('Products found:');
    res.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name || '[EMPTY]'}, Price: ${row.price}, Wholesale: ${row.wholesale_price}, Desc: ${row.description || '[NO DESC]'}`);
    });
  } else {
    console.log('No products found');
  }
  pool.end();
});

