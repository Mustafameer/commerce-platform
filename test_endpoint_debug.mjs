import fetch from 'node-fetch';

async function testEndpoint() {
  try {
    console.log('Testing /api/admin/stores endpoint...');
    const response = await fetch('http://localhost:3000/api/admin/stores');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
      'cache-control': response.headers.get('cache-control')
    });
    
    const text = await response.text();
    console.log('Raw response length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    const data = JSON.parse(text);
    console.log('Parsed data is array:', Array.isArray(data));
    console.log('Data length:', data.length);
    if (Array.isArray(data) && data.length > 0) {
      console.log('First item:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testEndpoint();
