import fetch from 'node-fetch';

async function testGuestCustomerPurchase() {
  console.log('🧪 Testing Guest Customer Topup Purchase\n');
  console.log('═'.repeat(70) + '\n');

  try {
    // Step 1: Create guest customer
    console.log('📍 Step 1: Register guest customer\n');
    
    const registerRes = await fetch('http://localhost:3000/api/admin/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'محمد الهير',
        phone: '07810909577',
        role: 'customer',
        password: 'guest123'
      })
    });

    const userData = await registerRes.json();
    const customerId = userData.id;
    
    console.log(`✅ Guest customer created: ID = ${customerId}\n`);

    // Step 2: Create topup order with guest customer
    console.log('📍 Step 2: Create topup order as guest customer\n');
    
    const purchaseRes = await fetch('http://localhost:3000/api/topup/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 13,
        topup_product_id: 95,
        quantity: 1,
        customer_id: customerId,
        customer_type: 'cash',
        phone: '07810909577',
        total_amount: 40000
      })
    });

    const purchaseData = await purchaseRes.json();

    if (!purchaseRes.ok) {
      throw new Error(purchaseData.error || 'Failed to create order');
    }

    console.log(`✅ Order created successfully!\n`);
    console.log(`Order Result:`, JSON.stringify(purchaseData, null, 2));

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ TEST PASSED!\n');
    console.log('Guest customers can now create topup orders without errors.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

testGuestCustomerPurchase();
