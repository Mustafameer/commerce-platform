import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkMerchants() {
  try {
    const result = await pool.query("SELECT id, name, phone, role, password, store_id FROM users WHERE role = 'merchant' ORDER BY id DESC LIMIT 5;");
    console.log('✅ Available Merchant Accounts for Testing:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    result.rows.forEach((row, i) => {
      console.log(`\n${i+1}. Name: ${row.name}`);
      console.log(`   Phone: ${row.phone}`);
      console.log(`   Password: ${row.password}`);
      console.log(`   Store ID: ${row.store_id}`);
    });
    
    const storesResult = await pool.query("SELECT id, owner_id, store_type, is_active FROM stores LIMIT 5;");
    console.log('\n\n✅ Stores:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(storesResult.rows, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkMerchants();
