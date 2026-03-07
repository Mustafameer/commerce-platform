// Test: Simulate what Frontend should be doing

const testScenario = {
  title: "Reseller Customer Purchase",
  customer: {
    id: 1,
    name: "محمد المير",
    phone: "07810909577",
    customer_type: "reseller"
  },
  products_from_api: [
    {
      id: 95,
      amount: 35000,
      price: 40000,           // Base price
      retail_price: 37500,    // للجملة (Reseller)
      wholesale_price: 37500  // للمفرد (Cash)
    }
  ]
};

console.log("🧪 TEST SCENARIO\n");
console.log(JSON.stringify(testScenario, null, 2));

// Simulate getDisplayPrice()
const getDisplayPrice = (selectedProduct, customerType) => {
  console.log("\n💰 getDisplayPrice() called with:");
  console.log(`  - customerType: ${customerType}`);
  console.log(`  - selectedProduct.retail_price: ${selectedProduct.retail_price}`);
  console.log(`  - selectedProduct.wholesale_price: ${selectedProduct.wholesale_price}`);
  console.log(`  - selectedProduct.price: ${selectedProduct.price}`);
  
  if (customerType === 'reseller') {
    if (selectedProduct.retail_price && selectedProduct.retail_price > 0) {
      console.log(`  ✅ Result: ${selectedProduct.retail_price} (retail_price)`);
      return selectedProduct.retail_price;
    } else if (selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0) {
      console.log(`  ✅ Result: ${selectedProduct.wholesale_price} (wholesale_price fallback)`);
      return selectedProduct.wholesale_price;
    } else if (selectedProduct.price && selectedProduct.price > 0) {
      console.log(`  ❌ Result: ${selectedProduct.price} (base price fallback - WRONG!)`);
      return selectedProduct.price;
    }
  }
  
  return 0;
};

// Test it
const product = testScenario.products_from_api[0];
const priceForReseller = getDisplayPrice(product, 'reseller');

console.log("\n📊 EXPECTED vs ACTUAL:");
console.log(`  Expected sent to server: 37500`);
console.log(`  Actually sent: ${priceForReseller * 1}`);
console.log(`  Match? ${priceForReseller === 37500 ? '✅ YES' : '❌ NO'}`);

console.log("\n🔍 IF IT'S 40000 INSTEAD:");
console.log("  It means selectedProduct.retail_price was NOT found or was 0");
console.log("  And the fallback to selectedProduct.price happened");
console.log("  This could happen if:");
console.log("    1. API didn't return retail_price");
console.log("    2. selectedProduct got set to a different object without retail_price");
console.log("    3. products state wasn't updated correctly");
