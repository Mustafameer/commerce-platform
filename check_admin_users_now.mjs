import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAdmins() {
  try {
    const result = await pool.query(`
      SELECT id, name, email, phone, role, can_access_admin, created_at 
      FROM users 
      WHERE role = 'admin' OR can_access_admin = true
      ORDER BY role DESC, created_at DESC
    `);
    
    console.log('Admin users found:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
    
    const allUsers = await pool.query('SELECT id, name, email, phone, role FROM users LIMIT 10');
    console.log('\nAll users (first 10):');
    console.log(JSON.stringify(allUsers.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmins();
