import fetch from 'node-fetch';

const API_URL = 'https://web-production-9efff.up.railway.app/api';

try {
  console.log('🔄 جاري تحديث شعار متجر الشحن...\n');
  
  // استخدم شعار "Bayt Al Deaq" - يمكن تغييره لاحقاً
  const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAiIGZpbGw9IiNENjMzMzMiLz4KPGN0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+4YW3wq7Ctjwv dGV4dD4KPC9zdmc+';
  
  const res = await fetch(`${API_URL}/stores/13`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      logo_url: logoBase64
    })
  });
  
  const data = await res.json();
  
  if (res.ok) {
    console.log('✅ تم تحديث الشعار بنجاح!');
    console.log('📊 البيانات المحدثة:', data);
  } else {
    console.log('❌ خطأ في التحديث:', data.error || data);
  }
  
} catch (err) {
  console.error('❌ خطأ:', err.message);
}
