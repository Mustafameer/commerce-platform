import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkAllUsers() {
  try {
    console.log('🔍 All Users in Database:\n');

    const usersResult = await pool.query(
      `SELECT id, name, phone, email, role, store_id FROM users ORDER BY id`
    );
    
    console.log(`📋 Total Users: ${usersResult.rows.length}\n`);
    
    usersResult.rows.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Phone: ${u.phone}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Store ID: ${u.store_id}\n`);
    });

    // Check stores
    console.log('\n🏪 Stores:\n');
    const storesResult = await pool.query(
      `SELECT id, slug, store_type FROM stores ORDER BY id`
    );
    
    storesResult.rows.forEach(s => {
      console.log(`ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllUsers();
