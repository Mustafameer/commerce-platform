#!/usr/bin/env node

import fetch from 'node-fetch';

async function speedTest() {
  console.log('\n⚡ SPEED TEST - API Response Times\n');
  console.log('═══════════════════════════════════════\n');

  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Test DB', path: '/api/test-db' },
    { name: 'Stores List', path: '/api/stores' },
    { name: 'Topup Products', path: '/api/topup/products/13' },
    { name: 'Setup Images', path: '/api/setup/images-table' },
  ];

  let totalTime = 0;
  let successCount = 0;

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        timeout: 5000
      });
      const time = Date.now() - start;
      const status = response.status;

      totalTime += time;
      if (status === 200) successCount++;

      const speedIndicator = 
        time < 100 ? '⚡ Fast' :
        time < 300 ? '✅ Good' :
        time < 500 ? '⚠️  Slow' :
        '🐢 Very Slow';

      console.log(`${endpoint.name.padEnd(20)} : ${time.toString().padStart(4)}ms | ${speedIndicator}`);
    } catch (error) {
      console.log(`${endpoint.name.padEnd(20)} : ❌ Error - ${error.message.substring(0, 30)}`);
    }
  }

  const avgTime = Math.round(totalTime / endpoints.length);
  console.log('\n═══════════════════════════════════════\n');
  console.log(`Average Response Time: ${avgTime}ms`);
  console.log(`Successful Requests: ${successCount}/${endpoints.length}\n`);

  if (avgTime < 100) {
    console.log('✅ Excellent performance!');
  } else if (avgTime < 300) {
    console.log('✅ Good performance');
  } else if (avgTime < 500) {
    console.log('⚠️  Acceptable performance (consider optimization)');
  } else {
    console.log('🔴 Poor performance (needs optimization)');
  }

  console.log('\n');
}

// Wait for server to be ready
setTimeout(speedTest, 2000);
