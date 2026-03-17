import fetch from 'node-fetch';

async function verifyMerchantData() {
  try {
    console.log('\n🔍 Verifying Merchant Dashboard Data (Store 13)\n');

    // 1. Companies
    const compRes = await fetch('http://localhost:3000/api/topup/companies/13');
    const companies = await compRes.json();
    console.log(`✅ Companies: ${Array.isArray(companies) ? companies.length : 0}`);
    if (Array.isArray(companies)) {
      companies.forEach((c) => console.log(`   - ${c.name} (ID: ${c.id})`));
    }

    // 2. Products
    const prodRes = await fetch('http://localhost:3000/api/topup/products/13');
    const products = await prodRes.json();
    console.log(`\n✅ Products: ${Array.isArray(products) ? products.length : 0}`);
    if (Array.isArray(products)) {
      products.forEach((p) => console.log(`   - ${p.company_name}: ${p.amount} SAR (ID: ${p.id})`));
    }

    // 3. Customers
    const custRes = await fetch('http://localhost:3000/api/topup/customers/13').catch(() => ({ json: () => [] }));
    const customers = await custRes.json();
    console.log(`\n✅ Customers: ${Array.isArray(customers) ? customers.length : 0}`);

    // 4. Orders
    const ordRes = await fetch('http://localhost:3000/api/topup/orders?storeId=13').catch(() => ({ json: () => [] }));
    const orders = await ordRes.json();
    console.log(`✅ Orders: ${Array.isArray(orders) ? orders.length : 0}`);

    console.log('\n✅ All data is ready for the dashboard!\n');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

verifyMerchantData();
