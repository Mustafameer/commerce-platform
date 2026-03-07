const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function testTransaction() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Transaction started');

    const name = 'تجربة فاشلة';
    const email = 'fail@test.com';
    const password = '123';
    const storeName = 'متجر التجربة';
    const category = 'عام';

    // 2. Create User
    const userResult = await client.query(
      "INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, 'merchant', TRUE) RETURNING id",
      [name, email, password]
    );
    const userId = userResult.rows[0].id;
    console.log('User created:', userId);

    let slug = storeName.trim().toLowerCase().replace(/\s+/g, '-');
    
    // 4. Create Store
    console.log('Inserting store...');
    await client.query(
      "INSERT INTO stores (owner_id, store_name, slug, status, owner_name, category, is_active) VALUES ($1, $2, $3, 'pending', $4, $5, FALSE)",
      [userId, storeName, slug, name, category]
    );

    console.log('Committing...');
    await client.query('COMMIT');
    console.log('Transaction successful');
  } catch (error) {
    console.log('Catch caught error! Rolling back...');
    console.error('ERROR:', error);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

testTransaction();
