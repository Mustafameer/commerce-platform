import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function checkMerchants() {
  try {
    const result = await pool.query("SELECT id, name, phone, role, password, store_id FROM users WHERE role = 'merchant' LIMIT 3;");
    console.log('✅ Merchant Accounts:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    const storesResult = await pool.query("SELECT id, owner_id, name, slug, store_type, is_active FROM stores LIMIT 3;");
    console.log('\n✅ Stores:');
    console.log(JSON.stringify(storesResult.rows, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkMerchants();
