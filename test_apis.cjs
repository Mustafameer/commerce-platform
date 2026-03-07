async function testAPIs() {
  const storeId = 13;
  const baseUrl = 'http://localhost:3000/api/topup';

  try {
    console.log('=== اختبار API Endpoints الجديدة ===\n');

    // اختبار الشركات
    const companiesRes = await fetch(`${baseUrl}/companies/${storeId}`);
    const companies = await companiesRes.json();
    console.log(`✅ الشركات (${companies.length}):`);
    companies.forEach(c => console.log(`  - ${c.name}`));

    // اختبار الفئات
    const categoriesRes = await fetch(`${baseUrl}/categories/${storeId}`);
    const categories = await categoriesRes.json();
    console.log(`\n✅ الفئات (${categories.length}):`);
    categories.forEach(c => console.log(`  - ${c.name}`));

    // اختبار المنتجات
    const productsRes = await fetch(`${baseUrl}/products/${storeId}`);
    const products = await productsRes.json();
    console.log(`\n✅ المنتجات (${products.length}):`);
    products.forEach(p => console.log(`  - ${p.company_name} | ${p.category_name} | ${p.amount} دينار`));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testAPIs();
