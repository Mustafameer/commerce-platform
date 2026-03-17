import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false,
});

(async () => {
  try {
    console.log('🔧 Adding email column...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
    console.log('✅ email column added');
    
    console.log('🔧 Setting email values...');
    await pool.query(`UPDATE users SET email = username || '@commerce.local' WHERE email IS NULL OR email = ''`);
    console.log('✅ email values updated');
    
    // Verify
    const result = await pool.query('SELECT id, username, email FROM users LIMIT 3');
    console.log('✅ Users with email:');
    result.rows.forEach(row => {
      console.log(`   - ${row.username}: ${row.email}`);
    });
    
    await pool.end();
  } catch(e) {
    console.log('❌ Error:', e.message);
    await pool.end();
  }
})();
