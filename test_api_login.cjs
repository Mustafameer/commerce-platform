#!/usr/bin/env node

const http = require('http');

async function testLoginAPI(phone, password, description) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ phone, password });
    
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log(`\n🧪 اختبار: ${description}`);
    console.log(`   الطلب: POST /api/login`);
    console.log(`   البيانات: phone="${phone}", password="${password}"`);

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`   الحالة: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          console.log(`   الرد:`, JSON.stringify(json, null, 2));
          if (res.statusCode === 200) {
            console.log(`   ✅ نجح الدخول`);
            if (json.store_type) {
              console.log(`   - نوع المتجر: ${json.store_type}`);
            }
          } else {
            console.log(`   ❌ فشل الدخول`);
          }
        } catch (e) {
          console.log(`   الرد (نص): ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ خطأ في الاتصال:', e.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🔍 ===== اختبار API للدخول =====');
  
  // Test 1: Topup store (should work)
  await testLoginAPI(
    '07810909577',
    '123456',
    'متجر الشحن (علي الهادي) - يجب أن ينجح'
  );

  // Test 2: Regular store 1 (test if it works)
  await testLoginAPI(
    '07810909578',
    '150165',
    'متجر عادي 1 (محمد علي) - هل ينجح؟'
  );

  // Test 3: Regular store 2 (البيت الانيق)
  await testLoginAPI(
    '07810909579',
    '123456',
    'متجر عادي 2 (البيت الانيق) - هل ينجح؟'
  );

  // Test 4: Wrong password for regular store
  await testLoginAPI(
    '07810909579',
    'wrongpassword',
    'متجر عادي 2 - كلمة مرور خاطئة (يجب أن يفشل)'
  );

  console.log('\n✅ انتهى الاختبار');
  process.exit(0);
}

// Give server time to start
setTimeout(runTests, 1000);
