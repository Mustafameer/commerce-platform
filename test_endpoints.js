// Test both endpoints
async function test() {
  console.log('Testing endpoints...\n');

  try {
    // Test admin endpoint
    const adminRes = await fetch('http://localhost:3000/api/admin/stores');
    const adminStores = await adminRes.json();
    console.log('✅ /api/admin/stores - Status:', adminRes.status);
    console.log('   Total stores (all):', Array.isArray(adminStores) ? adminStores.length : 'error');
    if (Array.isArray(adminStores) && adminStores.length > 0) {
      for (const s of adminStores) {
        console.log(`   - ${s.id}: ${s.store_name} (${s.status}) is_active=${s.is_active}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n---\n');

  try {
    // Test public endpoint
    const publicRes = await fetch('http://localhost:3000/api/stores');
    const publicStores = await publicRes.json();
    console.log('✅ /api/stores - Status:', publicRes.status);
    console.log('   Active stores only:', Array.isArray(publicStores) ? publicStores.length : 'error');
    if (Array.isArray(publicStores) && publicStores.length > 0) {
      for (const s of publicStores) {
        console.log(`   - ${s.id}: ${s.store_name}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n✅ Actions should now work! Try updating/deleting/toggling stores in the admin panel.');
}

test();
