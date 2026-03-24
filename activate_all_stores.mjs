import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('❌ [FATAL] DATABASE_URL environment variable not set.');
  console.error('   Cloud-only configuration requires DATABASE_URL to be set.');
  console.error('   Please set DATABASE_URL from Railway dashboard before running.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function activateStores() {
  try {
    console.log('🔄 جاري تفعيل جميع المتاجر...');
    
    // Get current state
    const beforeCount = await pool.query('SELECT COUNT(*) as count FROM stores WHERE is_active = true');
    console.log(`✓ المتاجر النشطة قبل التحديث: ${beforeCount.rows[0].count}`);
    
    // Activate all stores
    const result = await pool.query('UPDATE stores SET is_active = true RETURNING id, store_name');
    console.log(`\n✅ تم تفعيل ${result.rowCount} متجر:`);
    result.rows.forEach(row => {
      console.log(`   [${row.id}] ${row.store_name}`);
    });
    
    // Verify
    const afterCount = await pool.query('SELECT COUNT(*) as count FROM stores WHERE is_active = true');
    console.log(`\n✓ المتاجر النشطة بعد التحديث: ${afterCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

activateStores();
