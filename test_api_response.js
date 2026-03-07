const http = require('http');

// Test regular products
console.log('\n📦 Testing /api/products...\n');
const req1 = http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log(`Regular Products (first one):`);
      if (products.length > 0) {
        console.log(JSON.stringify(products[0], null, 2));
      }
    } catch (e) {
      console.error('Error parsing regular products:', e.message);
    }
    
    // Test topup products
    console.log('\n\n🎟️ Testing /api/topup/products/13...\n');
    const req2 = http.get('http://localhost:3000/api/topup/products/13', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const topupProducts = JSON.parse(data);
          console.log(`Topup Products (first one):`);
          if (topupProducts.length > 0) {
            console.log(JSON.stringify(topupProducts[0], null, 2));
          }
        } catch (e) {
          console.error('Error parsing topup products:', e.message);
        }
      });
    });
  });
});
