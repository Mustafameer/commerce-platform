import fetch from 'node-fetch';

const API_URL = 'https://web-production-9efff.up.railway.app/api';

const topupLogo = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cjwvc3ZnPg==`;

(async () => {
  try {
    console.log('\n🔍 Step 1: اختبار الاتصال بـ API...');
    
    // أولاً اختبر GET
    const getRes = await fetch(`${API_URL}/stores/13`);
    console.log(`GET Response Status: ${getRes.status}`);
    console.log(`Content-Type: ${getRes.headers.get('content-type')}`);
    
    const getText = await getRes.text();
    console.log(`Response Preview: ${getText.substring(0, 200)}`);
    
    if (getText.includes('<!doctype') || getText.includes('<html')) {
      console.log('❌ API يرجع HTML بدلاً من JSON');
      console.log('🔍 قد تكون المشكلة أن الـ endpoint لا يدعم PUT requests');
      return;
  }
  
  const storeData = JSON.parse(getText);
  console.log('✅ البيانات الحالية:', storeData);
  
  console.log('\n🔍 Step 2: محاولة تحديث الشعار عبر PUT...');
  
  const putRes = await fetch(`${API_URL}/stores/13`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      logo_url: topupLogo
    })
  });
  
  console.log(`PUT Response Status: ${putRes.status}`);
  const putText = await putRes.text();
  
  if (putText.includes('<!doctype') || putText.includes('<html')) {
    console.log('❌ PUT request لا يدعمه الـ API');
    console.log('💡 سأحاول استخدام POST بدلاً منه...');
    
    // Try POST
    const postRes = await fetch(`${API_URL}/stores/13`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logo_url: topupLogo
      })
    });
    
    console.log(`POST Response Status: ${postRes.status}`);
  } else {
    const data = JSON.parse(putText);
    console.log('✅ تم التحديث:', data);
  }
  
} catch (err) {
  console.error('❌ خطأ:', err.message);
}
})();
