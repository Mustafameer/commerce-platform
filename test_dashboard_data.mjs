import fetch from 'node-fetch';

async function testDashboard() {
  console.log('🧪 Testing Dashboard Data Loading...\n');
  
  try {
    // 1. Test Login
    console.log('1️⃣ Testing login with phone: 0791111111');
    const loginRes = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0791111111', password: 'password' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    
    const user = await loginRes.json();
    console.log('✅ Login successful:');
    console.log('   User ID:', user.id);
    console.log('   Store ID:', user.store_id);
    console.log('   Store Type:', user.store_type);
    console.log('   Role:', user.role);
    
    const storeId = user.store_id;
    
    // 2. Test Companies API
    console.log('\n2️⃣ Testing /api/topup/companies/13');
    const companiesRes = await fetch(`http://localhost:3000/api/topup/companies/${storeId}`);
    
    if (!companiesRes.ok) {
      throw new Error(`Companies API failed: ${companiesRes.status} ${companiesRes.statusText}`);
    }
    
    const companies = await companiesRes.json();
    console.log('✅ Companies loaded:');
    console.log('   Type:', Array.isArray(companies) ? 'Array' : typeof companies);
    console.log('   Count:', Array.isArray(companies) ? companies.length : 'N/A');
    if (Array.isArray(companies)) {
      companies.forEach((c, i) => {
        console.log(`   [${i}] ${c.name} (ID: ${c.id})`);
      });
    } else {
      console.log('   Response:', JSON.stringify(companies, null, 2));
    }
    
    // 3. Test Products API
    console.log('\n3️⃣ Testing /api/topup/products/13');
    const productsRes = await fetch(`http://localhost:3000/api/topup/products/${storeId}`);
    
    if (!productsRes.ok) {
      throw new Error(`Products API failed: ${productsRes.status} ${productsRes.statusText}`);
    }
    
    const products = await productsRes.json();
    console.log('✅ Products loaded:');
    console.log('   Type:', Array.isArray(products) ? 'Array' : typeof products);
    console.log('   Count:', Array.isArray(products) ? products.length : 'N/A');
    if (Array.isArray(products)) {
      products.slice(0, 3).forEach((p, i) => {
        console.log(`   [${i}] Company ${p.company_id} - ${p.company_name} - Price: ${p.price}`);
      });
    } else {
      console.log('   Response:', JSON.stringify(products, null, 2));
    }
    
    // 4. Test Customers API
    console.log('\n4️⃣ Testing /api/topup/customers/13');
    const customersRes = await fetch(`http://localhost:3000/api/topup/customers/${storeId}`);
    
    if (!customersRes.ok) {
      throw new Error(`Customers API failed: ${customersRes.status} ${customersRes.statusText}`);
    }
    
    const customers = await customersRes.json();
    console.log('✅ Customers loaded:');
    console.log('   Type:', Array.isArray(customers) ? 'Array' : typeof customers);
    console.log('   Count:', Array.isArray(customers) ? customers.length : 'N/A');
    
    // 5. Test Orders API
    console.log('\n5️⃣ Testing /api/topup/orders?storeId=13');
    const ordersRes = await fetch(`http://localhost:3000/api/topup/orders?storeId=${storeId}`);
    
    if (!ordersRes.ok) {
      throw new Error(`Orders API failed: ${ordersRes.status} ${ordersRes.statusText}`);
    }
    
    const orders = await ordersRes.json();
    console.log('✅ Orders loaded:');
    console.log('   Type:', Array.isArray(orders) ? 'Array' : typeof orders);
    console.log('   Count:', Array.isArray(orders) ? orders.length : 'N/A');
    
    console.log('\n✅ All APIs responding correctly with data!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboard();
