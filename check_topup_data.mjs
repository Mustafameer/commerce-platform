import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/commerce'
});

async function checkData() {
  try {
    console.log('\n📊 === TopUp System Data Check ===\n');
    
    // Check stores
    const storesRes = await pool.query('SELECT id, store_name, slug FROM stores LIMIT 5');
    console.log('📍 Stores:', storesRes.rows);
    
    if (storesRes.rows.length === 0) {
      console.log('❌ No stores found!');
      process.exit(1);
    }
    
    const storeId = storesRes.rows[0].id;
    console.log(`\n📦 Using store ID: ${storeId} (${storesRes.rows[0].store_name})\n`);
    
    // Check topup products
    const productsRes = await pool.query(
      `SELECT id, company_id, category_id, amount, price FROM topup_products 
       WHERE store_id = $1 LIMIT 5`,
      [storeId]
    );
    console.log(`🛍️  TopUp Products for store ${storeId}:`, productsRes.rows.length, 'records');
    if (productsRes.rows.length > 0) {
      console.log('   Sample:', productsRes.rows[0]);
    }
    
    // Check topup companies
    const companiesRes = await pool.query(
      `SELECT id, name FROM topup_companies 
       WHERE store_id = $1 LIMIT 5`,
      [storeId]
    );
    console.log(`🏢 TopUp Companies for store ${storeId}:`, companiesRes.rows.length, 'records');
    if (companiesRes.rows.length > 0) {
      console.log('   Sample:', companiesRes.rows[0]);
    }
    
    // Check topup categories
    const categoriesRes = await pool.query(
      `SELECT id, name FROM topup_product_categories 
       WHERE store_id = $1 LIMIT 5`,
      [storeId]
    );
    console.log(`📂 TopUp Categories for store ${storeId}:`, categoriesRes.rows.length, 'records');
    if (categoriesRes.rows.length > 0) {
      console.log('   Sample:', categoriesRes.rows[0]);
    }
    
    // Check customers
    const customersRes = await pool.query(
      'SELECT id, name, phone FROM customers LIMIT 5'
    );
    console.log(`👥 Customers:`, customersRes.rows.length, 'records');
    
    // Check topup orders
    const ordersRes = await pool.query(
      `SELECT id, customer_id, product_id FROM topup_orders LIMIT 5`
    );
    console.log(`📝 TopUp Orders:`, ordersRes.rows.length, 'records');
    
    // Check customer payments
    const paymentsRes = await pool.query(
      `SELECT id, customer_id, amount FROM customer_payments LIMIT 5`
    );
    console.log(`💳 Customer Payments:`, paymentsRes.rows.length, 'records');
    
    console.log('\n✅ Data check complete!\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkData();
