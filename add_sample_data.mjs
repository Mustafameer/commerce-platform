import http from 'http';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function addSampleData() {
  try {
    console.log('📝 Creating categories for store 13...\n');

    // Create categories
    const cat1 = await makeRequest('POST', '/api/topup/categories', {
      store_id: 13,
      name: 'أملية'
    });
    console.log('✅ Created category: أملية (ID:', cat1.id, ')');

    const cat2 = await makeRequest('POST', '/api/topup/categories', {
      store_id: 13,
      name: 'كوركس'
    });
    console.log('✅ Created category: كوركس (ID:', cat2.id, ')');

    const cat3 = await makeRequest('POST', '/api/topup/categories', {
      store_id: 13,
      name: 'زين الاخر'
    });
    console.log('✅ Created category: زين الاخر (ID:', cat3.id, ')');

    console.log('\n📦 Creating products for store 13...\n');

    // Add products
    const productsList = [
      { company: 1, category: cat1.id, company_name: 'Zain', cat_name: 'أملية', amount: 5000 },
      { company: 1, category: cat1.id, company_name: 'Zain', cat_name: 'أملية', amount: 10000 },
      { company: 2, category: cat2.id, company_name: 'Asiacell', cat_name: 'كوركس', amount: 5000 },
      { company: 2, category: cat2.id, company_name: 'Asiacell', cat_name: 'كوركس', amount: 15000 },
      { company: 3, category: cat3.id, company_name: 'Ooredoo', cat_name: 'زين الاخر', amount: 10000 },
      { company: 3, category: cat3.id, company_name: 'Ooredoo', cat_name: 'زين الاخر', amount: 25000 },
      { company: 4, category: cat1.id, company_name: 'HaloTel', cat_name: 'أملية', amount: 20000 }
    ];

    for (let prod of productsList) {
      const price = Math.round(prod.amount * 1.04);
      const retailPrice = price;
      const wholesalePrice = Math.round(prod.amount * 1.02);

      await makeRequest('POST', '/api/topup/products', {
        store_id: 13,
        company_id: prod.company,
        category_id: prod.category,
        amount: prod.amount,
        price: price,
        retail_price: retailPrice,
        wholesale_price: wholesalePrice,
        available_codes: 50
      });
      console.log('✅', prod.company_name, '-', prod.cat_name, prod.amount, 'IQD');
    }

    console.log('\n✅ All data added successfully!\n');

    // Verify
    console.log('📊 Verifying data...\n');
    const categories = await makeRequest('GET', '/api/topup/categories/13');
    const products_check = await makeRequest('GET', '/api/topup/products/13');

    console.log('Categories:', categories.length, '(expected 3)');
    console.log('Products:', products_check.length, '(expected 7)');

    if (categories.length > 0) {
      console.log('\n📂 Categories:');
      categories.forEach(c => console.log('  -', c.name));
    }

    if (products_check.length > 0) {
      console.log('\n📦 Products:');
      products_check.forEach(p => console.log('  -', p.company_name, '|', p.category_name, '|', p.amount, 'IQD'));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSampleData();
