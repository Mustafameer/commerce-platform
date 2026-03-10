import fetch from 'node-fetch';

const API_URL = 'https://web-production-9efff.up.railway.app/api';

// شعار SVG بسيط لمتجر الشحن
const topupLogo = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0iI0Q2MzMzMyIgc3Ryb2tlPSIjOEIwMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijg1IiBmaWxsPSJ3aGl0ZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0Q2MzMzMyIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj7ilJU8L3RleHQ+PHJlY3QgeD0iNDAiIHk9IjEzMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI0MCIgcng9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q2MzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iNDAiIHk9IjE0MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI4IiBmaWxsPSIjRDYzMzMzIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=`;

(async () => {
  try {
    console.log('🔄 جاري تحديث شعار متجر الشحن...\n');
    
    const res = await fetch(`${API_URL}/stores/13`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logo_url: topupLogo
      })
    });
    
    if (res.status === 200) {
      const data = await res.json();
      console.log('✅ تم تحديث الشعار بنجاح!');
      console.log('\n📊 تفاصيل المتجر المحدثة:');
      console.log(`   📛 اسم المتجر: ${data.store_name}`);
      console.log(`   👤 صاحب المتجر: ${data.owner_name}`);
      console.log(`   💳 النوع: ${data.store_type}`);
      console.log(`   🎨 الشعار: ✅ تم إضافة شعار جديد`);
      console.log(`   ✅ الحالة: ${data.status}`);
    } else {
      console.log(`❌ فشل التحديث: Status ${res.status}`);
      const text = await res.text();
      console.log(text.substring(0, 200));
    }
    
  } catch (err) {
    console.error('❌ خطأ:', err.message);
  }
})();
