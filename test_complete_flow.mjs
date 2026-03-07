import fetch from 'node-fetch';

async function runCompleteTest() {
  console.log('🧪 Complete Topup Order Flow Test\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Create a topup order via API
    console.log('📍 Step 1: Creating topup order via /api/topup/purchase\n');
    
    const purchasePayload = {
      store_id: 13,
      topup_product_id: 95,
      quantity: 1,
      customer_id: null,
      customer_type: 'cash',
      phone: '07810909577',
      total_amount: 40000
    };

    console.log('Request payload:', JSON.stringify(purchasePayload, null, 2));
    
    const purchaseRes = await fetch('http://localhost:3000/api/topup/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchasePayload)
    });

    const purchaseData = await purchaseRes.json();

    if (!purchaseRes.ok) {
      throw new Error(purchaseData.error || 'Failed to create order');
    }

    const orderId = purchaseData.order_id;
    console.log(`\n✅ Order created successfully: ID = ${orderId}\n`);

    // Step 2: Fetch the order from database
    console.log('📍 Step 2: Verifying order properties\n');

    const orderCheckRes = await fetch(`http://localhost:3000/api/topup/orders?storeId=13`);
    const ordersData = await orderCheckRes.json();
    const createdOrder = ordersData.find((o) => o.id === orderId);

    if (createdOrder) {
      console.log('✅ Order verification:');
      console.log(`  - ID: ${createdOrder.id}`);
      console.log(`  - is_topup_order: ${createdOrder.is_topup_order}`);
      console.log(`  - Store ID: ${createdOrder.store_id}`);
      console.log(`  - Amount: ${createdOrder.total_amount}`);
      console.log(`  - Status: ${createdOrder.status}\n`);

      if (createdOrder.is_topup_order) {
        console.log('✅ PASS: is_topup_order = true\n');
      } else {
        console.log('❌ FAIL: is_topup_order = false\n');
      }
    }

    // Step 3: Fetch topup codes
    console.log('📍 Step 3: Fetching topup codes\n');

    const codesRes = await fetch(`http://localhost:3000/api/topup/order-codes/${orderId}`);
    const codesData = await codesRes.json();

    console.log('Codes response:', JSON.stringify(codesData, null, 2));

    if (codesData.codes && codesData.codes.length > 0) {
      console.log(`\n✅ PASS: Retrieved ${codesData.codes.length} codes\n`);
    } else {
      console.log('\n⚠️  WARNING: No codes found\n');
    }

    console.log('=' .repeat(60));
    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runCompleteTest();
