// Test: Log what data is sent to server

const testData = {
  scenario: "Reseller customer buying 35000 topup",
  customer: {
    id: 1,
    name: "محمد المير",
    phone: "07712345678",
    customer_type: "reseller"
  },
  selectedProduct: {
    id: 95,
    amount: 35000,
    price: 40000,
    retail_price: 37500,
    wholesale_price: 37500,
    company_name: "MTN"
  },
  expected: {
    displayPrice: 37500,
    description: "Should use retail_price for reseller"
  },
  actual: {
    displayPrice: "Need to check console logs"
  }
};

console.log("🧪 Test Scenario:");
console.log(JSON.stringify(testData, null, 2));

console.log("\n📋 Expected Flow:");
console.log("1. Customer logs in as reseller (customer_type = 'reseller')");
console.log("2. Selects product with id=95");
console.log("3. getDisplayPrice() checks:");
console.log("   - customerType === 'reseller'? ✅ YES");
console.log("   - selectedProduct.retail_price? ✅ 37500");
console.log("   - Returns: 37500");
console.log("4. Sends to server: total_amount = 37500 * 1 = 37500");
console.log("5. Order saved with debt = 37500");

console.log("\n⚠️ Current Problem:");
console.log("- Order is showing debt = 40000 instead of 37500");
console.log("- This means wholesale_price is being used for reseller");
console.log("- Possible causes:");
console.log("  1. selectedProduct doesn't have retail_price when clicked");
console.log("  2. customerType is not correctly identified as 'reseller'");
console.log("  3. displayPrice calculation has a bug");

console.log("\n🔍 To Debug - Open browser console and:");
console.log("1. Login as محمد المير (reseller)");
console.log("2. Click on a product");
console.log("3. Check console for '💰 getDisplayPrice calculation' log");
console.log("4. Check console for '🛒 PURCHASE REQUEST DATA' when buying");
