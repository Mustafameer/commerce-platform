#!/usr/bin/env node
import fetch from 'node-fetch';

async function testImageEndpoints() {
  try {
    console.log('\n📸 Testing Image Upload Endpoints\n');

    // Test 1: Upload image
    console.log('1️⃣  Testing POST /api/products/1/images');
    const uploadRes = await fetch('http://localhost:3000/api/products/1/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 1,
        image_url: 'https://via.placeholder.com/300',
        image_type: 'jpeg',
        file_size: 15000
      })
    });
    const uploadData = await uploadRes.json();
    console.log(`   Status: ${uploadRes.status}`);
    console.log(`   Response:`, uploadData);

    // Test 2: Get images
    if (uploadRes.ok) {
      console.log('\n2️⃣  Testing GET /api/products/1/images');
      const getRes = await fetch('http://localhost:3000/api/products/1/images?store_id=1');
      const getData = await getRes.json();
      console.log(`   Status: ${getRes.status}`);
      console.log(`   Found ${getData.count} images`);
      if (getData.images.length > 0) {
        console.log(`   Sample:`, {
          id: getData.images[0].id,
          image_url: getData.images[0].image_url,
          image_type: getData.images[0].image_type
        });
      }
    }

    console.log('\n✅ Endpoints are working!\n');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

testImageEndpoints();
