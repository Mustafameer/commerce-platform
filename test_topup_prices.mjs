import fetch from 'node-fetch';

const storeId = 13;

async function testPrices() {
  console.log('🧪 Testing Topup Product Prices Fix\n');
  
  try {
    // 1. Check store type
    console.log('1️⃣  Checking Store Type...');
    const storeRes = await fetch(`http://localhost:3000/api/stores/${storeId}`)
      .then(r => r.json());
    
    console.log(`   Store Type: ${storeRes.store_type}`);
    console.log(`   Store Name: ${storeRes.store_name}\n`);
    
    // 2. Check OLD endpoint (should have minimal price info)
    console.log('2️⃣  OLD Endpoint: /api/products?storeId=13');
    const oldRes = await fetch(`http://localhost:3000/api/products?storeId=${storeId}`)
      .then(r => r.json());
    
    if (oldRes[0]) {
      console.log(`   Product 1:
   - ID: ${oldRes[0].id}
   - Amount: ${oldRes[0].amount}
   - Price: ${oldRes[0].price}
   - Retail Price: ${oldRes[0].retail_price}
   - Wholesale Price: ${oldRes[0].wholesale_price}\n`);
    }
    
    // 3. Check NEW endpoint (should have both retail and wholesale prices)
    console.log('3️⃣  NEW Endpoint: /api/topup/products/13');
    const newRes = await fetch(`http://localhost:3000/api/topup/products/${storeId}`)
      .then(r => r.json());
    
    if (newRes[0]) {
      console.log(`   Product 1:
   - ID: ${newRes[0].id}
   - Amount: ${newRes[0].amount}
   - Price: ${newRes[0].price}
   - Retail Price: ${newRes[0].retail_price}
   - Wholesale Price: ${newRes[0].wholesale_price}`);
      
      if (newRes[0].retail_price) {
        console.log(`\n   ✅ RETAIL_PRICE is available (will be used for resellers)`);
      } else {
        console.log(`\n   ❌ RETAIL_PRICE is missing`);
      }
      
      if (newRes[0].wholesale_price) {
        console.log(`   ✅ WHOLESALE_PRICE is available (will be used for cash customers)\n`);
      } else {
        console.log(`   ❌ WHOLESALE_PRICE is missing\n`);
      }
    }
    
    // 4. Show what reseller will see
    console.log('4️⃣  What Frontend Will Display:');
    
    newRes.slice(0, 3).forEach((product, idx) => {
      const displayPrice = product.retail_price || product.wholesale_price || product.price;
      console.log(`   Product ${idx + 1}: Reseller sees 💰 ${displayPrice}`);
    });
    
    console.log('\n5️⃣  Why It Was Broken:');
    console.log('   OLD: Frontend used /api/products (missing retail_price)');
    console.log('   ✅ FIXED: Frontend now uses /api/topup/products (includes retail_price)\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testPrices();
