import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:4fR9y2m8VxKl@web-production-9efff.up.railway.app:5432/multi_ecommerce'
});

async function fixStoreReferences() {
  try {
    console.log('🔧 Fixing store_id = 21 references...\n');
    
    // Check and update users with store_id = 21
    const users21 = await pool.query(
      'SELECT id, phone, name FROM users WHERE store_id = 21'
    );
    
    if (users21.rows.length > 0) {
      console.log(`⚠️  Found ${users21.rows.length} users with store_id = 21:`);
      users21.rows.forEach(u => console.log(`   ${u.phone} - ${u.name}`));
      
      // Update them to store 13
      const updateRes = await pool.query(
        'UPDATE users SET store_id = 13 WHERE store_id = 21'
      );
      console.log(`✅ Updated ${updateRes.rowCount} users to store_id = 13\n`);
    } else {
      console.log('✅ No users with store_id = 21\n');
    }
    
    // Check and update customers with store_id = 21
    const customers21 = await pool.query(
      'SELECT id, phone, name FROM customers WHERE store_id = 21'
    );
    
    if (customers21.rows.length > 0) {
      console.log(`⚠️  Found ${customers21.rows.length} customers with store_id = 21`);
      customers21.rows.forEach(c => console.log(`   ${c.phone} - ${c.name}`));
      
      // Update them to store 13
      const updateRes = await pool.query(
        'UPDATE customers SET store_id = 13 WHERE store_id = 21'
      );
      console.log(`✅ Updated ${updateRes.rowCount} customers to store_id = 13\n`);
    } else {
      console.log('✅ No customers with store_id = 21\n');
    }
    
    console.log('✅ All done!');
    await pool.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    await pool.end();
  }
}

fixStoreReferences();
