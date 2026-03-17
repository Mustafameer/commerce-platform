import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function testLogin() {
  try {
    console.log('🔍 Checking User 5 (تاجر الشحن):\n');

    // Check user in database
    const userResult = await pool.query(
      `SELECT id, name, phone, email, role, store_id FROM users WHERE id = 5`
    );
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User found in users table:');
      console.log('   ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Phone:', user.phone);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Store ID:', user.store_id);
    } else {
      console.log('❌ User not found');
    }

    // Test login via API
    console.log('\n🧪 Testing login via API:\n');
    const loginRes = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '0791111111', 
        password: 'password' 
      })
    });

    const loginData = await loginRes.json();
    console.log('API Response Status:', loginRes.status);
    console.log('API Response:', loginData);

    if (loginRes.ok) {
      console.log('\n✅ Login successful!');
      console.log('User data:', loginData.user);
    } else {
      console.log('\n❌ Login failed!');
      console.log('Error:', loginData.error || loginData.message);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
