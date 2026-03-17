import fetch from 'node-fetch';

console.log('🔐 Testing login...'); 

const loginData = {
  phone: '0771234567',
  password: 'password'
};

try {
  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  
  const data = await res.json();
  console.log('📊 Login Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (res.ok) {
    console.log('\n✅ Login successful!');
    console.log('User:', data.name, '| Role:', data.role, '| Store Type:', data.store_type);
  } else {
    console.log('\n❌ Login failed:', data.error);
  }
} catch (err) {
  console.log('❌ Error:', err.message);
}
