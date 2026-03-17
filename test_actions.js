// Test all action endpoints
async function testEndpoints() {
  console.log('🧪 اختبار نقاط نهاية الإجراءات...\n');

  // Get stores first to get an ID
  const storesRes = await fetch('http://localhost:3000/api/stores');
  const stores = await storesRes.json();
  
  if (!Array.isArray(stores) || stores.length === 0) {
    console.warn('❌ لا توجد متاجر للاختبار');
    return;
  }

  const testStoreId = stores[0].id;
  console.log(`✅ المتجر للاختبار: ID ${testStoreId} - "${stores[0].store_name}"\n`);

  // Test 1: Suspend
  console.log('1️⃣ اختبار suspend-store:');
  try {
    const res = await fetch(`http://localhost:3000/api/admin/suspend-store/${testStoreId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   الحالة: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`   الرد:`, data);
  } catch (e) {
    console.error(`   ❌ خطأ:`, e.message);
  }

  // Test 2: Toggle
  console.log('\n2️⃣ اختبار toggle-store:');
  try {
    const res = await fetch(`http://localhost:3000/api/admin/toggle-store/${testStoreId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   الحالة: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`   الرد:`, data);
  } catch (e) {
    console.error(`   ❌ خطأ:`, e.message);
  }

  // Test 3: Delete (لكن لا نفعلها فعلاً، فقط نختبر الاتصال)
  console.log('\n3️⃣ اختبار delete-store (OPTIONS request فقط):');
  try {
    const res = await fetch(`http://localhost:3000/api/admin/delete-store/${testStoreId}`, {
      method: 'OPTIONS'
    });
    console.log(`   الحالة: ${res.status} ${res.statusText}`);
    console.log(`   Headers:`, {
      'Access-Control-Allow-Methods': res.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Origin': res.headers.get('Access-Control-Allow-Origin')
    });
  } catch (e) {
    console.error(`   ❌ خطأ:`, e.message);
  }

  console.log('\n════════════════════════════════════════════');
  console.log('تم الاختبار ✅');
}

testEndpoints().catch(console.error);
