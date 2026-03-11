import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkStoresStatus() {
  try {
    console.log('🔍 Checking all stores status...\n');
    
    const result = await pool.query(
      `SELECT id, store_name, owner_name, status, is_active, created_at 
       FROM stores 
       ORDER BY id DESC`
    );
    
    console.log('📊 All Stores:');
    console.log('─'.repeat(90));
    console.log('ID  | Store Name | Owner Name | Status | is_active | Created');
    console.log('─'.repeat(90));
    
    let totalStores = 0;
    let pendingStores = 0;
    let approvedStores = 0;
    
    for (const store of result.rows) {
      const statusDisplay = store.status || 'NULL';
      const isActive = store.is_active ? '✓' : '✗';
      
      // Check if store is pending
      const isPending = !store.is_active && store.status === 'pending';
      const isApproved = store.is_active || store.status === 'approved' || store.status === 'active';
      
      const marker = isPending ? '🔴 PENDING' : isApproved ? '✅ APPROVED' : '❓ UNKNOWN';
      
      console.log(`${store.id.toString().padEnd(3)} | ${store.store_name.padEnd(10)} | ${store.owner_name.padEnd(10)} | ${statusDisplay.padEnd(8)} | ${isActive.padEnd(9)} | ${marker}`);
      
      totalStores++;
      if (isPending) pendingStores++;
      if (isApproved) approvedStores++;
    }
    
    console.log('─'.repeat(90));
    console.log('\n📈 Summary:');
    console.log(`   Total Stores: ${totalStores}`);
    console.log(`   Pending (waiting approval): ${pendingStores}`);
    console.log(`   Approved: ${approvedStores}`);
    
    console.log('\n⚠️ If Pending = 0 but you expect some stores to be pending:');
    console.log('   The issue is that all stores are marked as approved already.');
    console.log('   Old stores need to be reset to pending status.');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStoresStatus();
