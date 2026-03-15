import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function check() {
  try {
    console.log('🔍 Checking all store references...\n');
    
    // Check all stores
    const storesRes = await pool.query('SELECT id FROM stores ORDER BY id');
    console.log('📍 All store IDs in database:');
    storesRes.rows.forEach(s => console.log(`   ${s.id}`));
    
    console.log('\n');
    
    // Check users with store_id = 21
    const users21 = await pool.query('SELECT id, phone, name, store_id FROM users WHERE store_id = 21');
    console.log(`👥 Users with store_id = 21: ${users21.rows.length}`);
    users21.rows.forEach(u => console.log(`   ${u.phone} (${u.name}) → store ${u.store_id}`));
    
    // Check customers with store_id = 21  
    const customers21 = await pool.query('SELECT id, phone, name FROM customers WHERE store_id = 21');
    console.log(`\n🛒 Customers with store_id = 21: ${customers21.rows.length}`);
    customers21.rows.forEach(c => console.log(`   ${c.phone} (${c.name})`));
    
    // Check if store 21 exists
    const store21 = await pool.query('SELECT * FROM stores WHERE id = 21');
    console.log(`\n🏪 Store 21 exists: ${store21.rows.length > 0 ? 'YES' : 'NO'}`);
    
    await pool.end();
    console.log('\n✅ Done');
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

check();
