import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function check() {
  try {
    console.log('📊 Checking users and customers...\n');
    
    // Check users
    const usersRes = await pool.query('SELECT id, name, phone, role, store_id FROM users LIMIT 20');
    console.log('👥 USERS:');
    usersRes.rows.forEach(u => console.log(`  ID: ${u.id} | Name: ${u.name} | Phone: ${u.phone} | Role: ${u.role} | Store: ${u.store_id}`));
    
    console.log('\n');
    
    // Check customers
    const customersRes = await pool.query('SELECT id, name, phone, customer_type, store_id FROM customers LIMIT 20');
    console.log('🛒 CUSTOMERS:');
    customersRes.rows.forEach(c => console.log(`  ID: ${c.id} | Name: ${c.name} | Phone: ${c.phone} | Type: ${c.customer_type} | Store: ${c.store_id}`));
    
    console.log('\n');
    
    // Check stores
    const storesRes = await pool.query('SELECT id, name, store_type FROM stores');
    console.log('🏪 STORES:');
    storesRes.rows.forEach(s => console.log(`  ID: ${s.id} | Name: ${s.name} | Type: ${s.store_type}`));
    
    // Count by store_id
    console.log('\n');
    const storeCountRes = await pool.query('SELECT store_id, COUNT(*) as count FROM customers GROUP BY store_id ORDER BY store_id');
    console.log('📈 CUSTOMERS BY STORE:');
    storeCountRes.rows.forEach(r => console.log(`  Store ${r.store_id}: ${r.count} customers`));
    
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

check();
