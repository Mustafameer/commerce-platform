import fetch from 'node-fetch';

const API_URL = 'https://web-production-9efff.up.railway.app/api';

try {
  // جلب جميع المتاجر
  const res = await fetch(`${API_URL}/stores`);
  const stores = await res.json();
  
  console.log('\n📦 جميع المتاجر:');
  console.log('='.repeat(80));
  
  stores.forEach(store => {
    console.log(`\n🏪 ${store.store_name} (ID: ${store.id})`);
    console.log(`   النوع: ${store.store_type || 'unknown'}`);
    console.log(`   حالة النشاط: ${store.is_active ? '✅ نشط' : '❌ غير نشط'}`);
    console.log(`   الشعار (logo_url): ${store.logo_url ? `✅ موجود (${store.logo_url.substring(0, 50)}...)` : '❌ غير موجود'}`);
    console.log(`   الثيم: ${store.theme_color || 'default'}`);
  });
  
} catch (err) {
  console.error('❌ خطأ:', err.message);
}
