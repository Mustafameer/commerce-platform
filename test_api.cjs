const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/topup/products/13',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('=== API RESPONSE ===');
    try {
      const products = JSON.parse(data);
      console.log('Total products:', products.length);
      products.forEach(p => {
        console.log(`ID: ${p.id}, Company: ${p.company_name}, Category: ${p.category_name}, Amount: ${p.amount}`);
      });
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
