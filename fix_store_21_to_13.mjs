import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function fixStoreIds() {
  try {
    console.log('🔧 Fixing store_id references from 21 to 13...\n');
    
    // Check users with store_id = 21
    const userRes21 = await pool.query('SELECT * FROM users WHERE store_id = 21');
    if (userRes21.rows.length > 0) {
      console.log(`⚠️ Found ${userRes21.rows.length} users with store_id = 21`);
      const updateUserRes = await pool.query('UPDATE users SET store_id = 13 WHERE store_id = 21');
      console.log(`✅ Updated ${updateUserRes.rowCount} users from store 21 → 13`);
    }
    
    // Check customers with store_id = 21
    const customerRes21 = await pool.query('SELECT * FROM customers WHERE store_id = 21');
    if (customerRes21.rows.length > 0) {
      console.log(`⚠️ Found ${customerRes21.rows.length} customers with store_id = 21`);
      const updateCustomerRes = await pool.query('UPDATE customers SET store_id = 13 WHERE store_id = 21');
      console.log(`✅ Updated ${updateCustomerRes.rowCount} customers from store 21 → 13`);
    }
    
    // Check orders with store_id = 21
    const orderRes21 = await pool.query('SELECT COUNT(*) FROM orders WHERE store_id = 21');
    if (parseInt(orderRes21.rows[0].count) > 0) {
      console.log(`⚠️ Found ${orderRes21.rows[0].count} orders with store_id = 21`);
      const updateOrderRes = await pool.query('UPDATE orders SET store_id = 13 WHERE store_id = 21');
      console.log(`✅ Updated ${updateOrderRes.rowCount} orders from store 21 → 13`);
    }
    
    console.log('\n📊 Final verification:\n');
    
    // Verify users
    const usersRes = await pool.query('SELECT store_id, COUNT(*) as count FROM users GROUP BY store_id');
    console.log('👥 Users by store:');
    usersRes.rows.forEach(r => console.log(`   Store ${r.store_id}: ${r.count}`));
    
    // Verify customers
    const customersRes = await pool.query('SELECT store_id, COUNT(*) as count FROM customers GROUP BY store_id');
    console.log('\n🛒 Customers by store:');
    customersRes.rows.forEach(r => console.log(`   Store ${r.store_id}: ${r.count}`));
    
    // Verify orders
    const ordersRes = await pool.query('SELECT store_id, COUNT(*) as count FROM orders GROUP BY store_id');
    console.log('\n📦 Orders by store:');
    ordersRes.rows.forEach(r => console.log(`   Store ${r.store_id}: ${r.count}`));
    
    console.log('\n✅ All done!');
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

fixStoreIds();
