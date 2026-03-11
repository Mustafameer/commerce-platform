// Test customer statement endpoint
const testCustomerId = 1; // Change this to a real customer ID

console.log(`Testing /api/customers/${testCustomerId}/statement`);

fetch(`/api/customers/${testCustomerId}/statement`)
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('📊 Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
