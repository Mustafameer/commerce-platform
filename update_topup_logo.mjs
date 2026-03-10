import fetch from 'node-fetch';

const API_URL = 'https://web-production-9efff.up.railway.app/api';

// شعار بسيط لمتجر الشحن (كارت أحمر)
const topupLogo = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0iI0Q2MzMzMyIgc3Ryb2tlPSIjOEIwMDAwIiBzdHJva2Utd2lkdGg9IjIiLz4KICAKICAFN2cgKmNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4NSIgZmlsbD0id2hpdGUiLz4KICAKICAFN2cgKnRleHQgeD0iMTAwIiB5PSIxMTAiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRDYzMzMzIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPijwn5OlPC90ZXh0PgogIAogIAogASvyYSByZWN0IHg9IjQwIiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSIzIiBmaWxsPSJub25lIiBzdHJva2U9IiNENjMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgogIAogIAogASvyYSByZWN0IHg9IjQwIiB5PSIxNDAiIHdpZHRoPSIxMjAiIGhlaWdodD0iOCIgZmlsbD0iI0Q2MzMzMyIgb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==`;

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
  
  const data = await res.json();
  
  if (res.ok) {
    console.log('✅ تم تحديث الشعار بنجاح!');
    console.log('📊 معرف المتجر:', data.id || 13);
    console.log('📛 اسم المتجر:', data.store_name);
    console.log('🎨 الشعار:', data.logo_url ? '✅ موجود' : '❌ غير موجود');
  } else {
    console.log('❌ خطأ في التحديث:');
    console.log(data);
  }
  
} catch (err) {
  console.error('❌ خطأ الاتصال:', err.message);
}
