import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

try {
  const result = await pool.query("SELECT id, email, role, name FROM users WHERE role = 'admin'");
  console.log('✓ Admin users found:', result.rows.length);
  result.rows.forEach(u => {
    console.log(`  - ${u.email} (role: ${u.role})`);
  });
  
  if (result.rows.length === 0) {
    console.log('\n❌ No admin users found!');
    console.log('Creating a test admin user...');
    
    // Create an admin user
    const insertResult = await pool.query(
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role",
      ['admin@test.com', 'hashed_password_here', 'Admin User', 'admin']
    );
    console.log('Created admin user:', insertResult.rows[0]);
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
