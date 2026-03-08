import pkg from 'pg';
const { Pool } = pkg;

// Railway PostgreSQL connection (from load_data.sh)
const railwayUrl = 'postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway';

const pool = new Pool({
  connectionString: railwayUrl,
  ssl: { rejectUnauthorized: false } // Allow SSL connections from Railway
});

async function addAdminAccessColumn() {
  const client = await pool.connect();
  try {
    console.log('🔄 Connecting to Railway PostgreSQL...\n');

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

    console.log('❌ Column can_access_admin NOT found - Adding it now...');

    // Add the column
    await client.query(`
      ALTER TABLE users ADD COLUMN can_access_admin BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Column can_access_admin added successfully');

    // Set admin user to have access
    await client.query(`
      UPDATE users SET can_access_admin = true WHERE role = 'admin'
    `);
    
    console.log('✅ Updated admin user: can_access_admin = true');

    // Show the result
    const result = await client.query(`
      SELECT id, name, phone, email, role, can_access_admin FROM users WHERE role = 'admin' OR can_access_admin = true ORDER BY id
    `);
    
    console.log('\n📊 Users with admin access:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.release();
    await pool.end();
  }
}

addAdminAccessColumn();
