// Test script to diagnose store visibility issue
async function diagnoseStores() {
  console.log('🔍 السؤال: لماذا المتاجر الموافق عليها لا تظهر في لوحة التحكم؟\n');
  console.log('📊 جاري التشخيص...\n');

  try {
    // Test 1: Check what API returns
    const apiResponse = await fetch('http://localhost:3000/api/stores');
    const stores = await apiResponse.json();
    
    console.log('✅ استجابة API (/api/stores):');
    console.log('════════════════════════════════════════════════');
    console.log(`الحالة: ${apiResponse.status}`);
    console.log(`عدد المتاجر المعادة: ${Array.isArray(stores) ? stores.length : 'خطأ'}\n`);
    
    if (Array.isArray(stores) && stores.length > 0) {
      for (const store of stores) {
        console.log(`  🏪 ${store.id}: "${store.store_name}"`);
        console.log(`     • الصاحب: ${store.owner_name} (${store.owner_phone})`);
        console.log(`     • الحالة: ${store.is_active ? '✅ مفعل' : '❌ معطل'}`);
        console.log(`     • الموافقة: ${store.status}`);
        console.log();
      }
    } else if (Array.isArray(stores) && stores.length === 0) {
      console.log('  ❌ لا توجد متاجر يتم إرجاعها من API\n');
    } else {
      console.log('  ❌ خطأ في صيغة الاستجابة');
      console.log('  الاستجابة:', stores);
      console.log();
    }

    // Test 2: Try admin endpoint
    console.log('✅ التحقق من نقطة البيانات الإدارية (/api/admin/stores):');
    console.log('════════════════════════════════════════════════');
    try {
      const adminResponse = await fetch('http://localhost:3000/api/admin/stores', {
        headers: {
          'Authorization': 'Bearer admin-token' // May or may not be needed
        }
      });
      
      if (adminResponse.ok) {
        const adminStores = await adminResponse.json();
        console.log(`الحالة: ${adminResponse.status}`);
        console.log(`عدد المتاجر: ${Array.isArray(adminStores) ? adminStores.length : 'خطأ'}\n`);
        
        if (Array.isArray(adminStores) && adminStores.length > 0) {
          for (const store of adminStores.slice(0, 3)) {
            console.log(`  🏪 ${store.id}: "${store.store_name}"`);
          }
        }
      } else {
        console.log(`الحالة: ${adminResponse.status} ${adminResponse.statusText}`);
      }
    } catch (err) {
      console.log(`  ⚠️  خطأ في الوصول: ${err.message}`);
    }

    console.log('\n📝 الخلاصة:');
    console.log('════════════════════════════════════════════════');
    if (Array.isArray(stores) && stores.length > 0) {
      console.log('✅ API يعيد المتاجر بنجاح');
      console.log('⚠️  المشكلة قد تكون في:');
      console.log('   1. عدم تحديث لوحة التحكم (refresh needed)');
      console.log('   2. مشكلة في الكود الأمامي (frontend code)');
      console.log('   3. مشكلة في المتصفح cache');
    } else {
      console.log('❌ API لا يعيد أي متاجر');
      console.log('المشكلة قد تكون في:');
      console.log('   1. فلتر API WHERE is_active = true');
      console.log('   2. المتاجر ليست موجودة في قاعدة البيانات');
      console.log('   3. المتاجر مرة أخرى معطلة (is_active = false)');
    }
    
  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error.message);
  }
}

diagnoseStores();
