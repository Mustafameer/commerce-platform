import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

pool.query('SELECT id, owner_id, store_name FROM stores ORDER BY id', (err, res) => {
  if(err) {
    console.log('ERROR:', err.message);
  } else {
    console.log('Database Stores:');
    console.log(JSON.stringify(res?.rows || [], null, 2));
  }
  pool.end();
});
