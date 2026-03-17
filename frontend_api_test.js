// Test if frontend can access the API
console.log('=== Testing Frontend API Connection ===');

fetch('/api/admin/stores')
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    return res.json();
  })
  .then(data => {
    console.log('API Response received:');
    console.log('- Type:', typeof data);
    console.log('- Is Array:', Array.isArray(data));
    console.log('- Count:', data?.length || 0);
    console.log('- Full Data:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('✓ Frontend CAN access stores from API');
    } else {
      console.log('✗ Frontend received empty data');
    }
  })
  .catch(err => {
    console.error('✗ Frontend CANNOT access API:', err.message);
  });
