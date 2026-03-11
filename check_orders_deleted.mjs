import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkOrdersAfterDeletion() {
  try {
    console.log('🔍 Checking orders after deletion...\n');
    
    // Check total orders
    const ordersResult = await pool.query(
      `SELECT COUNT(*) as order_count FROM orders WHERE store_id = 13 AND is_topup_order = true`
    );
    
    // Check with details
    const detailedResult = await pool.query(
      `SELECT id, customer_id, total_amount, status, is_topup_order, created_at 
       FROM orders 
       WHERE store_id = 13 AND is_topup_order = true
       ORDER BY created_at DESC`
    );
    
    const orderCount = ordersResult.rows[0].order_count;
    
    console.log('📊 Orders Summary:');
    console.log(`   Total topup orders: ${orderCount}`);
    console.log(`\n📋 Orders Details:`);
    console.log('─'.repeat(80));
    
    if (orderCount === 0) {
      console.log('✅ No orders found - all deleted successfully');
    } else {
      console.log(`ID  | Customer | Amount | Status | Created`);
      console.log('─'.repeat(80));
      
      detailedResult.rows.forEach((order, i) => {
        console.log(`${order.id} | ${order.customer_id} | ${order.total_amount} | ${order.status} | ${order.created_at.toISOString().split('T')[0]}`);
      });
    }
    
    console.log('─'.repeat(80));
    
    // Check products
    console.log('\n📦 Products Check:');
    const productsResult = await pool.query(
      `SELECT id, available_codes, array_length(codes, 1) as codes_count
       FROM topup_products
       WHERE store_id = 13 AND is_active = true`
    );
    
    let totalCodes = 0;
    for (const p of productsResult.rows) {
      totalCodes += p.available_codes;
      console.log(`   Product ${p.id}: available=${p.available_codes}, actual=${p.codes_count}`);
    }
    
    console.log(`\n📈 Expected Dashboard Stats:`);
    console.log(`   Total Codes: ${totalCodes}`);
    console.log(`   Used Codes: ${orderCount}`);
    console.log(`   Active Codes: ${totalCodes - orderCount}`);
    
    if (orderCount > 0) {
      console.log(`\n⚠️ WARNING: Dashboard showing 39, but database has ${orderCount} orders!`);
      console.log(`   Calculation: 50 - ${orderCount} = ${50 - orderCount}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrdersAfterDeletion();
