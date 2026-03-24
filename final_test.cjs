const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      reject(err);
    });
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🧪 Testing Customer Verification...\n');
    
    // Test: Get customers from store 4 (topup store)
    console.log('📝 Fetching customers from store 4...');
    const customers = await makeRequest('/api/merchant/customers?storeId=4');
    
    if (!Array.isArray(customers)) {
      console.log('❌ Error:', customers);
      process.exit(1);
    }
    
    console.log(`✅ Got ${customers.length} customers\n`);
    customers.forEach(c => {
      console.log(`   - ID: ${c.id}, Name: "${c.name}", Phone: "${c.phone}"`);
    });
    
    // Simulate matching logic
    console.log('\n🔍 Simulating search for مصطفى / 07810909577...');
    const searchName = 'مصطفى';
    const searchPhone = '07810909577';
    
    const normalizePhone = (phone) => {
      if (!phone) return '';
      let normalized = phone.replace(/[\s\-()]/g, '');
      normalized = normalized.replace(/^\+/, '');
      if (normalized.startsWith('964')) {
        normalized = '0' + normalized.substring(3);
      }
      return normalized.trim();
    };
    
    const normalizedSearchPhone = normalizePhone(searchPhone);
    
    const matches = customers.filter(c => {
      const normalizedDbPhone = normalizePhone(c.phone);
      const nameMatch = c.name.toLowerCase().trim() === searchName.toLowerCase().trim();
      const phoneMatch = normalizedDbPhone === normalizedSearchPhone;
      console.log(`   Checking: "${c.name}" (${nameMatch}) | "${normalizedDbPhone}" (${phoneMatch})`);
      return nameMatch && phoneMatch;
    });
    
    console.log(`\n${matches.length > 0 ? '✅ CUSTOMER FOUND!' : '❌ NO MATCH'}`);
    if (matches.length > 0) {
      console.log(`✅ Customer ${matches[0].name} can now login`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait for server to start
setTimeout(testAPI, 2000);
