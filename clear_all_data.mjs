import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();

try {
  console.log('⚠️  بدء حذف جميع البيانات من قاعدة البيانات...\n');

  // List of tables to clear (in order of dependencies)
  const tables = [
    'topup_orders',
    'order_items',
    'orders',
    'cart_items',
    'customers',
    'topup_orders_detail',
    'topup_products',
    'topup_product_categories',
    'topup_companies',
    'stores',
    'products',
    'categories',
    'company_users'
  ];

  for (const table of tables) {
    try {
      const result = await client.query(`DELETE FROM ${table}`);
      console.log(`✅ تم حذف بيانات ${table}: ${result.rowCount} سجل`);
    } catch (err) {
      console.log(`⚠️  ${table}: ${err.message}`);
    }
  }

  // Reset sequences
  console.log('\n🔄 إعادة تعيين الـ ID sequences...\n');
  
  const sequences = [
    'stores_id_seq',
    'categories_id_seq',
    'products_id_seq',
    'customers_id_seq',
    'orders_id_seq',
    'order_items_id_seq',
    'topup_companies_id_seq',
    'topup_product_categories_id_seq',
    'topup_products_id_seq',
    'topup_orders_id_seq',
    'company_users_id_seq'
  ];

  for (const seq of sequences) {
    try {
      await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
      console.log(`✅ تم إعادة تعيين ${seq}`);
    } catch (err) {
      console.log(`⚠️  ${seq}: ${err.message}`);
    }
  }

  console.log('\n✅ تم حذف جميع البيانات بنجاح!');
  console.log('📊 الجداول والبنية محفوظة - جاهزة لبيانات جديدة');

} catch (error) {
  console.error('❌ خطأ:', error);
} finally {
  await client.end();
}
