import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function fixPendingStores() {
  try {
    console.log('🔧 Fixing pending stores issue...\n');
    
    // Get stores that have is_active = true but status is not 'approved' or 'active'
    const badStores = await pool.query(
      `SELECT id, store_name, owner_name, status, is_active 
       FROM stores 
       WHERE is_active = true AND (status IS NULL OR status NOT IN ('approved', 'active'))
       ORDER BY id`
    );
    
    console.log('📊 Current Status:');
    console.log(`   Found ${badStores.rows.length} stores needing fix\n`);
    
    if (badStores.rows.length > 0) {
      console.log('📝 Stores to fix:');
      console.log('─'.repeat(70));
      
      for (const store of badStores.rows) {
        console.log(`   ID: ${store.id} | ${store.store_name} (${store.owner_name}) | Status: ${store.status} | is_active: ${store.is_active}`);
      }
      
      console.log('─'.repeat(70));
      
      // Fix: Set these to pending status
      // Option 1: If status is NULL, set to 'pending'
      // Option 2: If status is 'pending' already, but is_active is true, set is_active to false
      
      for (const store of badStores.rows) {
        if (store.status === null) {
          // This store was approved manually but status wasn't set
          console.log(`\n⚠️ Store ${store.id}: Status is NULL - marking as pending with is_active=false`);
          
          await pool.query(
            `UPDATE stores SET status = $1, is_active = $2 WHERE id = $3`,
            ['pending', false, store.id]
          );
          
          console.log(`   ✅ Fixed`);
        } else if (store.is_active === true && store.status !== 'approved' && store.status !== 'active') {
          console.log(`\n⚠️ Store ${store.id}: Status is '${store.status}' but is_active=true (inconsistent)`);
          console.log(`   This might be intentional, keeping as is`);
        }
      }
    }
    
    // Now list all stores with their current status
    console.log('\n\n✨ All Stores Status After Fix:');
    console.log('─'.repeat(70));
    
    const allStores = await pool.query(
      `SELECT id, store_name, owner_name, status, is_active 
       FROM stores 
       ORDER BY id`
    );
    
    console.log('ID  | Store Name | Owner Name | Status | Active');
    console.log('─'.repeat(70));
    
    for (const store of allStores.rows) {
      const statusDisplay = store.status || 'NULL';
      console.log(`${store.id.toString().padEnd(3)} | ${store.store_name.padEnd(15)} | ${store.owner_name.padEnd(12)} | ${statusDisplay.padEnd(9)} | ${store.is_active}`);
    }
    
    console.log('─'.repeat(70));
    console.log('\n✅ Fix complete!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPendingStores();
