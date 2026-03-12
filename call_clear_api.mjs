import https from 'https';

const options = {
  hostname: 'web-production-9efff.up.railway.app',
  port: 443,
  path: '/api/admin/clear-transactions',
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 0
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (data.startsWith('{')) {
      try {
        const json = JSON.parse(data);
        console.log('\n✅ تم المسح بنجاح!');
        console.log('البيانات المحذوفة:');
        console.log(`  - المعاملات: ${json.cleared.transactions}`);
        console.log(`  - الدفعات: ${json.cleared.payments}`);
        console.log(`  - طلبات التوب أب: ${json.cleared.topupOrders}`);
        console.log(`  - العملاء المُحدثة: ${json.cleared.customersReset}`);
      } catch (e) {
        console.log('Response text:', data);
      }
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
