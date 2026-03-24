import fetch from 'node-fetch';

const storeId = 4;

console.log('🔍 Debugging TopupStorefront product fetching...\n');

try {
  const response = await fetch(`http://localhost:3000/api/topup/products/${storeId}`);
  const data = await response.json();
  
  console.log(`📊 Total products returned: ${data.length}\n`);
  
  data.forEach((product, idx) => {
    console.log(`Product ${idx + 1}:`);
    console.log(`  id: ${product.id}`);
    console.log(`  company_id: ${product.company_id} (type: ${typeof product.company_id})`);
    console.log(`  company_name: ${product.company_name}`);
    console.log(`  amount: ${product.amount}`);
    console.log(`  price: ${product.price}`);
    console.log(`  retail_price: ${product.retail_price}`);
    console.log(`  wholesale_price: ${product.wholesale_price}`);
    console.log(`  images array length: ${product.images ? product.images.length : 0}`);
    console.log(`  gallery array length: ${product.gallery ? product.gallery.length : 0}`);
    console.log(`  Keys in product:`, Object.keys(product).join(', '));
    console.log('');
  });
  
  // Test the filter logic
  console.log('\n🧪 Testing filter logic with selectedCompany = "" (empty string):\n');
  
  const selectedCompany = '';
  const filteredProducts = data.filter(p => 
    (!selectedCompany || p.company_id === parseInt(selectedCompany))
  );
  
  console.log(`✅ filtered products: ${filteredProducts.length}`);
  console.log(`   Expected: ${data.length} (all products should pass when selectedCompany is empty)\n`);
  
  // Test with specific company
  if (data.length > 0 && data[0].company_id) {
    console.log('🧪 Testing filter logic with selectedCompany = "' + data[0].company_id + '":\n');
    const selectedCompanyId = String(data[0].company_id);
    const filteredProducts2 = data.filter(p => 
      (!selectedCompanyId || p.company_id === parseInt(selectedCompanyId))
    );
    console.log(`✅ filtered products: ${filteredProducts2.length}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
