import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkAllStoresData() {
  try {
    console.log('🔍 Detailed Stores Analysis\n');
    
    // Get all stores with their users
    const result = await pool.query(
      `SELECT 
        s.id,
        s.store_name,
        s.owner_name,
        s.owner_phone,
        s.status,
        s.is_active,
        s.created_at,
        u.id as user_id,
        u.name as user_name,
        u.phone as user_phone,
        u.store_id as user_store_id
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       ORDER BY s.id DESC`
    );
    
    console.log('📊 Full Stores Data:');
    console.log('─'.repeat(120));
    
    for (const row of result.rows) {
      console.log(`\nStore ID: ${row.id}`);
      console.log(`  Store Name: ${row.store_name}`);
      console.log(`  Owner: ${row.owner_name} (${row.owner_phone})`);
      console.log(`  Status: ${row.status} | is_active: ${row.is_active}`);
      console.log(`  User Link: User ${row.user_id} (${row.user_name}), user.store_id: ${row.user_store_id}`);
      console.log(`  Created: ${row.created_at}`);
    }
    
    console.log('\n─'.repeat(120));
    
    // Check for duplicates
    const duplicateCheck = await pool.query(
      `SELECT store_name, COUNT(*) as count FROM stores GROUP BY store_name HAVING COUNT(*) > 1`
    );
    
    console.log('\n🔎 Duplicate Check:');
    if (duplicateCheck.rows.length > 0) {
      console.log('❌ Found duplicate stores:');
      for (const dup of duplicateCheck.rows) {
        console.log(`   - ${dup.store_name}: ${dup.count} times`);
      }
    } else {
      console.log('✅ No duplicates found');
    }
    
    // Count summary
    console.log('\n📈 Count Summary:');
    const totalCount = result.rows.length;
    const pendingCount = result.rows.filter(r => !r.is_active && r.status === 'pending').length;
    const approvedCount = result.rows.filter(r => r.is_active || r.status === 'approved' || r.status === 'active').length;
    
    console.log(`   Total Distinct Stores: ${totalCount}`);
    console.log(`   Pending (awaiting approval): ${pendingCount}`);
    console.log(`   Approved: ${approvedCount}`);
    
    if (totalCount !== (pendingCount + approvedCount)) {
      console.log(`\n⚠️ WARNING: Sum ${pendingCount + approvedCount} != Total ${totalCount}`);
      console.log('   There may be stores with unknown status');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllStoresData();
