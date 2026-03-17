import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce', ssl: false});

(async () => {
  console.log('🔍 مراقبة البيانات في النظام:\n');
  
  // Check users
  const users = await pool.query('SELECT id, name, phone, role, store_id FROM users');
  console.log('📋 المستخدمون:');
  users.rows.forEach(u => {
    console.log(`  - ${u.name} (${u.phone}) | Store: ${u.store_id} | Role: ${u.role}`);
  });

  // Check stores
  const stores = await pool.query('SELECT id, store_type FROM stores WHERE id IN (1, 13)');
  console.log('\n🏪 المتاجر:');
  stores.rows.forEach(s => {
    console.log(`  - Store ${s.id}: ${s.store_type || 'regular'}`);
  });

  // Check topup companies
  const companies = await pool.query('SELECT COUNT(*) as count FROM topup_companies WHERE store_id = 13');
  console.log(`\n🏢 شركات الشحن في Store 13: ${companies.rows[0].count}`);

  // Check topup products
  const products = await pool.query('SELECT COUNT(*) as count FROM topup_products WHERE store_id = 13');
  console.log(`📦 منتجات الشحن في Store 13: ${products.rows[0].count}`);

  console.log('\n✅ البيانات جاهزة للعرض في المتصفح!');
  console.log('🔗 اذهب إلى: http://localhost:3000/topup-merchant');
  console.log('📱 الهاتف: 0771234567');
  console.log('🔐 كلمة المرور: password');

  await pool.end();
})();
