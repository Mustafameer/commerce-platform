// Test script to verify what happens when loading /admin/stores

const testFrontendAPI = async () => {
  console.log('🧪 Testing Frontend API Flow...');
  
  // Test 1: Check if API endpoint works
  console.log('\n✓ Test 1: Checking API endpoint');
  try {
    const storesRes = await fetch('http://localhost:3000/api/admin/stores');
    const stores = await storesRes.json();
    console.log(`  - API returned ${stores.length} stores`);
    stores.forEach(s => {
      console.log(`    - ${s.store_name} (ID: ${s.id})`);
    });
  } catch (err) {
    console.error(`  ✗ API Error: ${err.message}`);
    return;
  }
  
  // Test 2: Check the HTML response
  console.log('\n✓ Test 2: Checking HTML response from /admin/stores');
  try {
    const htmlRes = await fetch('http://localhost:3000/admin/stores');
    const html = await htmlRes.text();
    
    // Check for React app container
    if (html.includes('root')) {
      console.log(`  - HTML contains React root element`);
    } else {
      console.log(`  ✗ HTML missing React root element`);
    }
    
    // Check for stores in HTML
    const storeNames = ['البيت الانيق', 'علي الهادي'];
    for (const name of storeNames) {
      if (html.includes(name)) {
        console.log(`  - Found "${name}" in HTML✓`);
      } else {
        console.log(`  -NOT found "${name}" in HTML`);
      }
    }
  } catch (err) {
    console.error(`  ✗ HTML Error: ${err.message}`);
  }
};

testFrontendAPI();
