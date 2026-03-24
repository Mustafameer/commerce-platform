const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, {
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function testAPI() {
  try {
    console.log('🧪 Testing... fetching customers from store 4\n');
    const customers = await makeRequest('/api/merchant/customers?storeId=4');
    
    if (!Array.isArray(customers)) {
      console.log('❌ Error:', customers);
      process.exit(1);
    }
    
    console.log(`✅ Found ${customers.length} customers:\n`);
    customers.forEach(c => console.log(`   ${c.name} (${c.phone})`));
    
    // Test match
    const testName = 'مصطفى';
    const testPhone = '07810909577';
    
    const normalizePhone = (p) => {
      let norm = (p || '').replace(/[\s\-()]/g, '').replace(/^\+/, '');
      if (norm.startsWith('964')) norm = '0' + norm.substring(3);
      return norm.trim();
    };
    
    const matches = customers.filter(c => 
      c.name.toLowerCase().trim() === testName.toLowerCase().trim() &&
      normalizePhone(c.phone) === normalizePhone(testPhone)
    );
    
    console.log(`\n🔍 Search for "${testName} / ${testPhone}": ${matches.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (matches.length > 0) {
      console.log(`✅ Login should work now for ${matches[0].name}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

testAPI();
