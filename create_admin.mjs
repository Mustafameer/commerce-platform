import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

const createAdmin = async () => {
  try {
    // Delete existing admin test account if any
    await pool.query("DELETE FROM users WHERE email = 'admin@test.com'");
    
    // Get the next ID from the sequence
    const seqResult = await pool.query(
      "SELECT nextval('users_id_seq') as next_id"
    ).catch(async () => {
      // If sequence doesn't exist, just get the max id + 1
      const maxResult = await pool.query("SELECT MAX(id) as max_id FROM users");
      const maxId = maxResult.rows[0].max_id || 0;
      return { rows: [{ next_id: maxId + 1 }] };
    });
    
    const userId = seqResult.rows[0].next_id;
    
    // Create new admin account with explicit ID
    await pool.query(
      "INSERT INTO users (id, email, password, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role",
      [userId, 'admin@test.com', 'password123', 'Admin', 'admin']
    );
    
    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: password123');
    console.log('');
    console.log('🌐 Steps:');
    console.log('   1. Go to: http://localhost:3000/login');
    console.log('   2. Enter: admin@test.com / password123');
    console.log('   3. Then go to: http://localhost:3000/admin/stores');
    console.log('');
    console.log('✓ You should see the 2 stores!');
    console.log('');
    
    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    try {
      await pool.end();
    } catch {}
  }
};

createAdmin();
