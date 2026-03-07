import fetch from 'node-fetch';

async function testTopupPurchase() {
  try {
    console.log('🧪 Testing /api/topup/purchase endpoint...\n');

    const payload = {
      store_id: 13,
      topup_product_id: 95,
      quantity: 1,
      customer_id: null,
      customer_type: 'cash',
      phone: '07810909577',
      total_amount: 40000
    };

    console.log('📤 Sending request:', JSON.stringify(payload, null, 2));

    const response = await fetch('http://localhost:3000/api/topup/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Success!');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      console.log(`\n✨ New Topup Order Created: ID=${data.order_id}`);
    } else {
      console.log('\n❌ Error!');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testTopupPurchase();
