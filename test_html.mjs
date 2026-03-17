import fs from 'fs';

// Test HTML response from /admin/stores
const response = await fetch('http://localhost:3000/admin/stores');
const html = await response.text();

// Save HTML to file for inspection
fs.writeFileSync('admin_stores_response.html', html);

// Check for store names
const storeChecks = {
  'البيت الانيق': html.includes('البيت الانيق'),
  'علي الهادي': html.includes('علي الهادي'),
  'AdminDashboard': html.includes('AdminDashboard'),
  'renderStoresTable': html.includes('renderStoresTable'),
  'admin/stores': html.includes('admin/stores'),
  'إدارة المتاجر': html.includes('إدارة المتاجر'),
  'app.js': html.includes('app.js') || html.includes('app-'),
};

console.log('📄 HTML Content Check:');
Object.entries(storeChecks).forEach(([key, found]) => {
  console.log(`  ${found ? '✅' : '❌'} Contains "${key}"`);
});

// Look for React app
const appMatch = html.match(/app-[a-zA-Z0-9]+\.js/);
if (appMatch) {
  console.log('\n📦 Found app bundle:', appMatch[0]);
} else {
  console.log('\n❌ No app bundle found - check HTML');
}

// Show first 2000 chars
console.log('\n📋 First 2000 characters of HTML:');
console.log(html.substring(0, 2000));

console.log('\n✅ Full HTML saved to admin_stores_response.html');
