const http = require('http');

async function testPurchase() {
  return new Promise((resolve) => {
    // Test data for purchase
    const purchaseData = JSON.stringify({
      store_id: 13,
      items: [
        {
          topup_product_id: 92,
          quantity: 2
        }
      ],
      customer_name: "Test Customer",
      customer_phone: "0789999999"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/topup/purchase',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': purchaseData.length
      }
    };

    console.log('📞 Making test purchase request...\n');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response:`, data);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      resolve();
    });

    req.write(purchaseData);
    req.end();

    // Wait a moment and then check the product codes
    setTimeout(async () => {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
      });

      try {
        console.log('\n✏️  Checking product codes after purchase...\n');
        const result = await pool.query(`
          SELECT array_length(codes, 1) as code_count, codes
          FROM topup_products 
          WHERE id = 92
        `);

        const codeCount = result.rows[0].code_count;
        console.log(`Product 92 current codes: ${codeCount}`);
        console.log(`Expected codes: 9 (was 11, removed 2)`);
        
        if (codeCount === 9) {
          console.log(`\n✅ SUCCESS! Codes were deleted by the purchase API!`);
        } else {
          console.log(`\n⚠️  Code count changed but verify it's correct`);
        }

        await pool.end();
      } catch (e) {
        console.error('Error checking codes:', e.message);
      }
    }, 2000);
  });
}

testPurchase();
