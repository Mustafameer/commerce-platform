// Quick test to see what /api/admin/stores returns
fetch('http://localhost:3000/api/admin/stores')
  .then(r => r.json())
  .then(stores => {
    console.log('✅ /api/admin/stores response:');
    console.log('Total stores:', stores.length);
    console.log('Stores:', JSON.stringify(stores, null, 2));
  })
  .catch(e => console.error('Error:', e.message));
