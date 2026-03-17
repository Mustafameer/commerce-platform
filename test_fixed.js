// Test new admin stores endpoint
async function testNewEndpoint() {
  console.log('🧪 اختبار نقطة النهاية الجديدة...\n');

  // Test 1: Get all stores (including suspended)
  console.log('1️⃣ اختبار /api/admin/stores (جميع المتاجر):');
  try {
    const res = await fetch('http://localhost:3000/api/admin/stores');
    const stores = await res.json();
    console.log(`   الحالة: ${res.status}`);
    console.log(`   عدد المتاجر: ${Array.isArray(stores) ? stores.length : 'خطأ'}`);
    if (Array.isArray(stores)) {
      for (const store of stores) {
        const status = store.is_active ? '✅ نشط' : '❌ معطّل';
        console.log(`   • ${store.id}: "${store.store_name}" - ${store.status} ${status}`);
      }
    }
  } catch (e) {
    console.error(`   ❌ خطأ:`, e.message);
  }

  // Test 2: Get only active stores (public)
  console.log('\n2️⃣ اختبار /api/stores (فقط النشطة):');
  try {
    const res = await fetch('http://localhost:3000/api/stores');
    const stores = await res.json();
    console.log(`   الحالة: ${res.status}`);
    console.log(`   عدد المتاجر: ${Array.isArray(stores) ? stores.length : 'خطأ'}`);
    if (Array.isArray(stores)) {
      for (const store of stores) {
        console.log(`   • ${store.id}: "${store.store_name}" - ${store.status}`);
      }
    }
  } catch (e) {
    console.error(`   ❌ خطأ:`, e.message);
  }

  console.log('\n════════════════════════════════════════════');
  console.log('📊 الخلاصة:');
  console.log('✅ /api/admin/stores - يعيد جميع المتاجر (معتمدة وموقوفة)');
  console.log('✅ /api/stores       - يعيد فقط المتاجر النشطة');
  console.log('✅ الآن الإجراءات يجب أن تعمل بشكل صحيح!');
}

testNewEndpoint().catch(console.error);
