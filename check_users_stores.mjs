import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

// Check users
pool.query('SELECT id, name, phone, role FROM users', async (err, res) => {
  if(err) {
    console.log('ERROR:', err.message);
  } else {
    console.log('Users in Database:');
    console.log(JSON.stringify(res?.rows || [], null, 2));
  }
  
  // Check store owners
  pool.query(`
    SELECT id, store_name, owner_id, owner_name, owner_phone, is_active 
    FROM stores
  `, (err2, res2) => {
    if(err2) {
      console.log('ERROR:', err2.message);
    } else {
      console.log('\n\nStores in Database:');
      console.log(JSON.stringify(res2?.rows || [], null, 2));
    }
    pool.end();
  });
});
