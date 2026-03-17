// Check the different store endpoints
async function compareEndpoints() {
  console.log('📊 مقارنة نقاط نهاية المتاجر المختلفة:\n');
  console.log('════════════════════════════════════════════════');

  try {
    // Check /api/stores
    console.log('\n1️⃣ GET /api/stores (المتاجر العامة):');
    const storesRes = await fetch('http://localhost:3000/api/stores');
    const stores = await storesRes.json();
    console.log(`   الحالة: ${storesRes.status}`);
    console.log(`   العدد: ${Array.isArray(stores) ? stores.length : 'خطأ'}`);
    if (Array.isArray(stores) && stores.length > 0) {
      for (const s of stores) {
        console.log(`     • ${s.id}: ${s.store_name} (${s.status})`);
      }
    }

    // Check /api/admin/pending-stores  
    console.log('\n2️⃣ GET /api/admin/pending-stores (المتاجر بانتظار الموافقة):');
    try {
      const pendingRes = await fetch('http://localhost:3000/api/admin/pending-stores');
      if (pendingRes.ok) {
        const pending = await pendingRes.json();
        console.log(`   الحالة: ${pendingRes.status}`);
        console.log(`   العدد: ${Array.isArray(pending) ? pending.length : 'خطأ'}`);
        if (Array.isArray(pending) && pending.length > 0) {
          for (const p of pending) {
            console.log(`     • ${p.id}: ${p.store_name} (${p.status})`);
          }
        } else if (Array.isArray(pending)) {
          console.log('   ✅ لا توجد متاجر بانتظار الموافقة (جيد!)');
        }
      } else {
        console.log(`   ❌ الحالة: ${pendingRes.status}`);
      }
    } catch (e) {
      console.log(`   ⚠️ خطأ: ${e.message}`);
    }

    // Check /api/admin/stores
    console.log('\n3️⃣ GET /api/admin/stores (نقطة نهاية الإدارة):');
    try {
      const adminRes = await fetch('http://localhost:3000/api/admin/stores');
      if (adminRes.ok) {
        const adminStores = await adminRes.json();
        console.log(`   الحالة: ${adminRes.status}`);
        console.log(`   نوع الرد: ${adminRes.headers.get('content-type')}`);
        console.log(`   الحجم: ${typeof adminStores}`);
      } else {
        console.log(`   الحالة: ${adminRes.status}`);
        const text = await adminRes.text();
        if (text.includes('<!DOCTYPE')) {
          console.log('   ⚠️ الرد: صفحة HTML (خطأ 404 أو محمي)');
        }
      }
    } catch (e) {
      console.log(`   ⚠️ خطأ: ${e.message}`);
    }

    console.log('\n════════════════════════════════════════════════');
    console.log('📝 الخلاصة:');
    console.log('  • /api/stores: المتاجر المعتمدة (يجب أن $يظهرها الدashboard)');
    console.log('  • /api/admin/pending-stores: المتاجر بانتظار الموافقة');
    console.log('  • عندما تضغط "موافقة": المتجر ينقل من pending → approved');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

compareEndpoints();
