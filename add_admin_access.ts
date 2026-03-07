import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function addAdminAccessColumn() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding can_access_admin column to users table...\n');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'can_access_admin'
      ) as exists
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Column can_access_admin already exists');
      await client.release();
      await pool.end();
      return;
    }

    // Add the column
    await client.query(`
      ALTER TABLE users ADD COLUMN can_access_admin BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Column can_access_admin added successfully');

    // Set admin user to have access
    await client.query(`
      UPDATE users SET can_access_admin = true WHERE role = 'admin'
    `);
    
    console.log('✅ Admin user (role=admin) has can_access_admin = true');

    // Show the result
    const result = await client.query(`
      SELECT id, name, phone, role, can_access_admin FROM users ORDER BY id
    `);
    
    console.log('\n📊 Users with admin access:');
    result.rows.forEach(user => {
      if (user.can_access_admin) {
        console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
      }
    });

    await client.release();
    await pool.end();
  } catch (error) {
    await client.release();
    console.error('❌ Error:', (error as any).message);
    await pool.end();
    process.exit(1);
  }
}

addAdminAccessColumn();
