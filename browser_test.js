// Browser console test
fetch('/api/admin/stores')
  .then(r => {
    console.log('Response status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    return r.json();
  })
  .then(data => {
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data.length);
    console.log('Full data:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err);
  });
