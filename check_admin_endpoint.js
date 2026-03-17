// Check admin stores endpoint more carefully
async function checkAdminEndpoint() {
  console.log('🔍 التحقق من نقطة نهاية الإدارة...\n');

  try {
    // Try without auth
    console.log('1️⃣  محاولة بدون المصادقة:');
    let response = await fetch('http://localhost:3000/api/admin/stores');
    console.log(`   الحالة: ${response.status}`);
    console.log(`   نوع المحتوى: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<!doctype')) {
      console.log('   ❌ الرد HTML (صفحة خطأ)');
      console.log('   السبب المحتمل: المصادقة مطلوبة أو عدم وجود المسار\n');
    } else if (text.startsWith('{')) {
      console.log('   ✅ الرد JSON');
      try {
        const data = JSON.parse(text);
        console.log(`   عدد المتاجر: ${Array.isArray(data) ? data.length : '؟'}\n`);
      } catch (e) {
        console.log(`   ⚠️  خطأ في parsing JSON\n`);
      }
    } else {
      console.log('   ⚠️  رد غير متوقع');
      console.log(`   أول 100 حرف: ${text.substring(0, 100)}\n`);
    }

    // Check if endpoint exists
    console.log('2️⃣  فحص المسارات الممكنة الأخرى:');
    const endpoints = [
      'http://localhost:3000/api/stores',
      'http://localhost:3000/api/admin/dashboard',
      'http://localhost:3000/api/dashboard',
      'http://localhost:3000/api/all-stores'
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint);
        console.log(`   ${res.status} - ${endpoint}`);
      } catch (e) {
        console.log(`   ❌ - ${endpoint}`);
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error.message);
  }
}

checkAdminEndpoint();
