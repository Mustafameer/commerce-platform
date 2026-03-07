async function testAddCompany() {
  try {
    console.log('🔧 جاري اختبار إضافة شركة للمتجر 13...\n');

    const response = await fetch('http://localhost:3000/api/topup/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 13,
        name: 'زين اثير',
        logo_url: ''
      })
    });

    console.log(`📤 Response Status: ${response.status}`);
    const data = await response.json();
    console.log(`📥 Response Data:`, data);

    // التحقق من البيانات
    const checkRes = await fetch('http://localhost:3000/api/topup/companies/13');
    const companies = await checkRes.json();
    console.log(`\n✅ الشركات الحالية: ${companies.length}`);
    companies.forEach(c => console.log(`  - ${c.name}`));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testAddCompany();
