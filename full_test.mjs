import fetch from 'node-fetch';

console.log('🧪 COMPREHENSIVE TEST - Simulating full UI logic\n');

try {
  // Step 1: Fetch products exactly as API returns them
  console.log('📍 Step 1: Fetching products from API');
  const productsRes = await fetch('http://localhost:3000/api/topup/products/4');
  const products = await productsRes.json();
  
  console.log(`✅ Got ${products.length} products from API\n`);
  
  // Step 2: Initial component state (like when component first renders)
  const selectedCompany = ''; // Empty string initially
  const customer = null; // Not logged in
  
  console.log('📍 Step 2: Initial component state');
  console.log(`   selectedCompany = "${selectedCompany}"`);
  console.log(`   customer = ${customer}\n`);
  
  // Step 3: Filter products (exact code from component)
  console.log('📍 Step 3: Applying filter');
  const filteredProducts = products.filter(p => {
    if (!selectedCompany) return true;
    const searchTerm = selectedCompany.toLowerCase();
    const companyMatch = p.company_name?.toLowerCase().includes(searchTerm);
    const amountMatch = String(p.amount).includes(selectedCompany);
    return companyMatch || amountMatch;
  });
  
  console.log(`✅ Filtered: ${filteredProducts.length} products (expected all 4)\n`);
  
  // Step 4: Map products and calculate prices (exact code from component)
  console.log('📍 Step 4: Mapping and calculating prices\n');
  
  filteredProducts.forEach((product, idx) => {
    // Exact code from component
    const productImages = Array.isArray(product.images) 
      ? product.images.filter((img) => img && String(img).length > 0)
      : [];
    const imagesCount = productImages.length;
    
    // Exact price calculation from component
    const displayPrice = (() => {
      if (!customer) {
        return product.wholesale_price || product.price || 0;
      }
      if (customer.customer_type === 'reseller' && product.retail_price) {
        return product.retail_price;
      }
      return product.wholesale_price || product.price || 0;
    })();
    
    console.log(`Card ${idx + 1}:`)
    console.log(`  ID: ${product.id}`);
    console.log(`  Company: ${product.company_name}`);
    console.log(`  Amount: ${product.amount} د.ع`);
    console.log(`  Display Price: ${displayPrice} د.ع`);
    console.log(`  Images Count: ${imagesCount}`);
    console.log(`  Button Enabled: ${imagesCount > 0 ? '✅ YES' : '❌ NO'}\n`);
  });
  
  // Step 5: Check if any have issues
  console.log('📍 Step 5: Quality checks\n');
  
  const zeroPrices = filteredProducts.filter(p => {
    const p_price = p.wholesale_price || p.price || 0;
    return p_price === 0 || p_price === '0';
  });
  
  const noImages = filteredProducts.filter(p => {
    const productImages = Array.isArray(p.images) 
      ? p.images.filter((img) => img && String(img).length > 0)
      : [];
    return productImages.length === 0;
  });
  
  console.log(`Products with price 0: ${zeroPrices.length}`);
  console.log(`Products with no images: ${noImages.length}`);
  console.log(`All images present: ${zeroPrices.length === 0 && noImages.length === 0 ? '✅ YES' : '❌ NO'}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
