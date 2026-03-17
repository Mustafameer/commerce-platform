import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

pool.query('SELECT id, store_name, is_active, status, owner_id FROM stores ORDER BY id', (err, res) => {
  if(err) {
    console.log('ERROR:', err.message);
  } else {
    console.log('Stores in Database:');
    console.log(JSON.stringify(res?.rows || [], null, 2));
  }
  pool.end();
});
