// Simulate frontend behavior exactly
async function simulateFrontendDataLoading() {
  console.log('🌍 Simulating Frontend Dashboard Data Loading...\n');
  
  const topupStoreId = 13;
  
  try {
    // Simulate timeout logic exactly like frontend
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API request timeout')), 10000)
    );

    const fetchWithTimeout = (url) => 
      Promise.race([
        fetch(url)
          .then(r => {
            if (!r.ok) {
              console.error(`❌ API returned ${r.status}:`, r.statusText);
              throw new Error(`HTTP ${r.status}`);
            }
            return r.json();
          }),
        timeout
      ]);

    console.log('📡 Fetching from /api/topup/companies/' + topupStoreId);
    console.log('📡 Fetching from /api/topup/products/' + topupStoreId);
    console.log('📡 Fetching from /api/topup/customers/' + topupStoreId);
    console.log('📡 Fetching from /api/topup/orders?storeId=' + topupStoreId);
    console.log('');

    const [comp, prod, cust, ordersData] = await Promise.all([
      fetchWithTimeout(`http://localhost:3000/api/topup/companies/${topupStoreId}`).catch((err) => {
        console.error('❌ Companies fetch failed:', err.message);
        return [];
      }),
      fetchWithTimeout(`http://localhost:3000/api/topup/products/${topupStoreId}`).catch((err) => {
        console.error('❌ Products fetch failed:', err.message);
        return [];
      }),
      fetchWithTimeout(`http://localhost:3000/api/topup/customers/${topupStoreId}`).catch((err) => {
        console.error('❌ Customers fetch failed:', err.message);
        return [];
      }),
      fetchWithTimeout(`http://localhost:3000/api/topup/orders?storeId=${topupStoreId}`).catch((err) => {
        console.error('❌ Orders fetch failed:', err.message);
        return [];
      }),
    ]);

    console.log('✅ All responses received:\n');
    console.log('📊 Dashboard Data Loaded:', {
      companies: comp,
      products: prod,
      customers: cust,
      orders: ordersData
    });

    // Check if data is properly stored
    const companies = Array.isArray(comp) ? comp : [];
    const products = Array.isArray(prod) ? prod : [];
    const customers = Array.isArray(cust) ? cust : [];
    const orders = Array.isArray(ordersData) ? ordersData : [];

    console.log('\n📈 Data Status:');
    console.log(`   Companies: ${companies.length} items (${companies.length > 0 ? '✅' : '⚠️ EMPTY'})`);
    console.log(`   Products: ${products.length} items (${products.length > 0 ? '✅' : '⚠️ EMPTY'})`);
    console.log(`   Customers: ${customers.length} items (${customers.length > 0 ? '✅' : '⚠️ EMPTY'})`);
    console.log(`   Orders: ${orders.length} items (${orders.length > 0 ? '✅' : '⚠️ EMPTY'})`);

    if (companies.length > 0) {
      console.log('\n🏢 Sample Companies:');
      companies.forEach((c, i) => {
        console.log(`   [${i}] ${c.name} (ID: ${c.id})`);
      });
    }

    if (products.length > 0) {
      console.log('\n📦 Sample Products:');
      products.slice(0, 3).forEach((p, i) => {
        console.log(`   [${i}] Price: ${p.price} (Company ID: ${p.company_id})`);
      });
    }

    console.log('\n✅ Frontend data loading simulation completed successfully!');
    console.log('🖥️  Dashboard should display data if browser fetch is working the same way.');

  } catch (error) {
    console.error('\n❌ Simulation error:', error);
    process.exit(1);
  }
}

// Use node-fetch for testing
import('node-fetch').then(({ default: fetch }) => {
  globalThis.fetch = fetch;
  simulateFrontendDataLoading();
});
