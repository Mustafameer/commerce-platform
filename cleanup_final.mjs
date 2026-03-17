import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function cleanupFinal() {
  try {
    console.log('🔍 Checking users linked to Store 2:\n');

    const usersResult = await pool.query(
      `SELECT id, name, phone, store_id FROM users WHERE store_id = 2`
    );
    
    if (usersResult.rows.length > 0) {
      console.log('Users to delete:');
      usersResult.rows.forEach(u => {
        console.log(`   ID: ${u.id} | Name: ${u.name} | Phone: ${u.phone}`);
      });

      // Delete these users
      await pool.query('DELETE FROM users WHERE store_id = 2');
      console.log('\n✅ Deleted users from Store 2');
    }

    // Now delete Store 2
    console.log('🗑️ Deleting Store 2...');
    await pool.query('DELETE FROM stores WHERE id = 2');
    console.log('✅ Deleted Store 2\n');

    // Show final state
    console.log('✅ Final stores and users:\n');
    const storesResult = await pool.query(
      `SELECT id, slug, store_type FROM stores ORDER BY id`
    );
    
    console.log('Stores:');
    storesResult.rows.forEach(s => {
      console.log(`   ID: ${s.id} | Slug: ${s.slug} | Type: ${s.store_type || 'regular'}`);
    });

    const allUsersResult = await pool.query(
      `SELECT id, name, phone, store_id, role FROM users ORDER BY id`
    );
    
    console.log('\nUsers:');
    allUsersResult.rows.forEach(u => {
      console.log(`   ID: ${u.id} | Name: ${u.name} | Phone: ${u.phone} | Store: ${u.store_id || 'N/A'} | Role: ${u.role}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupFinal();
