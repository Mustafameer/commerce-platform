async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/stores');
    const data = await res.json();
    const store13 = data.find(s => s.id === 13);
    
    if (store13) {
      console.log('Store 13 found:');
      console.log('ID:', store13.id);
      console.log('Name:', store13.store_name);
      console.log('is_active:', store13.is_active);
      console.log('status:', store13.status);
      console.log('Full:', JSON.stringify(store13, null, 2));
    } else {
      console.log('Store 13 not found');
      console.log('Total stores:', data.length);
      console.log('All:', data);
    }
  } catch(err) {
    console.error('Error:', err.message);
  }
}

test();
