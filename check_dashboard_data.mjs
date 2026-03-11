import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '123',
  host: 'localhost',
  port: 5432,
  database: 'multi_ecommerce'
});

async function checkCodesData() {
  try {
    console.log('🔍 Checking topup_products and order data...\n');
    
    // Get products
    const productsResult = await pool.query(
      `SELECT id, available_codes, array_length(codes, 1) as codes_array_count, codes
       FROM topup_products 
       WHERE store_id = 13 AND is_active = true
       ORDER BY id`
    );
    
    // Get orders count
    const ordersResult = await pool.query(
      `SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue
       FROM orders
       WHERE store_id = 13 AND is_topup_order = true`
    );
    
    console.log('📦 PRODUCTS (Store 13):');
    console.log('─'.repeat(80));
    console.log('ID | available_codes | codes_array_count | Match | First 3 Codes');
    console.log('─'.repeat(80));
    
    let totalAvailable = 0;
    let totalActual = 0;
    let mismatchCount = 0;
    
    for (const product of productsResult.rows) {
      const { id, available_codes, codes_array_count, codes } = product;
      const actualCount = codes_array_count || 0;
      const match = available_codes === actualCount;
      
      if (!match) mismatchCount++;
      totalAvailable += available_codes || 0;
      totalActual += actualCount || 0;
      
      const codesPreview = Array.isArray(codes) && codes.length > 0 
        ? codes.slice(0, 3).join(', ') 
        : 'N/A';
      
      console.log(
        `${id} | ${(available_codes || 0).toString().padEnd(15)} | ${(actualCount || 0).toString().padEnd(17)} | ${match ? '✅' : '❌'} | ${codesPreview}`
      );
    }
    
    console.log('─'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Products: ${productsResult.rows.length}`);
    console.log(`   Total available_codes: ${totalAvailable}`);
    console.log(`   Total actual codes: ${totalActual}`);
    console.log(`   Mismatches: ${mismatchCount}`);
    
    const { order_count, total_revenue } = ordersResult.rows[0];
    console.log(`\n💰 ORDERS (Store 13):`);
    console.log(`   Order count: ${order_count}`);
    console.log(`   Total revenue: ${total_revenue || 0}`);
    
    console.log(`\n🧮 EXPECTED DASHBOARD STATS:`);
    console.log(`   Available Codes (should be): ${totalActual}`);
    console.log(`   Used Codes: ${order_count}`);
    console.log(`   Active Codes: ${totalActual - order_count}`);
    console.log(`   Total Revenue: ${total_revenue || 0}`);
    
    // Now check what API returns
    console.log('\n\n📡 CHECKING API RESPONSE...');
    const apiProducts = await fetch('http://localhost:3000/api/topup/products/13')
      .then(r => r.json())
      .catch(e => console.error('API Error:', e.message));
    
    if (Array.isArray(apiProducts)) {
      console.log('✅ API Products returned successfully');
      let apiTotalCodes = 0;
      
      apiProducts.forEach((p, i) => {
        const codeCount = p.available_codes || (Array.isArray(p.codes) ? p.codes.length : 0);
        console.log(`   Product ${p.id}: available_codes=${p.available_codes}, codes_array_length=${Array.isArray(p.codes) ? p.codes.length : 'N/A'}`);
        apiTotalCodes += codeCount;
      });
      
      console.log(`\n   Total codes from API: ${apiTotalCodes}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCodesData();
