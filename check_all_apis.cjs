const http = require('http');

const endpoints = [
  '/api/topup/companies/13',
  '/api/topup/categories/13',
  '/api/topup/products/13'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ path, data: parsed });
        } catch (e) {
          resolve({ path, error: data });
        }
      });
    });
    req.on('error', (e) => resolve({ path, error: e.message }));
    req.end();
  });
}

async function test() {
  console.log('=== COMPLETE DATA CHECK ===\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.error) {
      console.log(`${endpoint}: ERROR -`, result.error);
    } else {
      console.log(`${endpoint}:`);
      if (typeof result.data === 'object' && Array.isArray(result.data)) {
        console.log(`  Total: ${result.data.length}`);
        result.data.forEach(item => {
          if (item.name) console.log(`  - ID ${item.id}: ${item.name}`);
          else if (item.company_name) console.log(`  - ID ${item.id}: ${item.company_name} | ${item.category_name} | ${item.amount}`);
          else console.log(`  - ID ${item.id}`);
        });
      }
      console.log();
    }
  }
}

test();
