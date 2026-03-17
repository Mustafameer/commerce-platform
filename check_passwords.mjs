import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkPassword() {
  try {
    console.log('🔍 Checking passwords in database:\n');

    const result = await pool.query(
      `SELECT id, name, phone, password FROM users WHERE id IN (1, 2, 3, 4, 5)`
    );
    
    result.rows.forEach(u => {
      console.log(`ID: ${u.id} | Name: ${u.name} | Phone: ${u.phone}`);
      console.log(`   Password: "${u.password}"`);
      console.log();
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPassword();
