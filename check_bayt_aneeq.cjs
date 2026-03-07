const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function checkStore() {
  try {
    console.log('🔍 ===== البحث عن متجر البيت الانيق =====\n');

    // Search for stores with similar name
    const stores = await pool.query(
      "SELECT id, store_name, is_active, created_at FROM stores WHERE store_name ILIKE '%الانيق%' OR store_name ILIKE '%البيت%' OR store_name ILIKE '%elegant%' OR store_name ILIKE '%bayt%'"
    );

    console.log('📍 المتاجر المطابقة:');
    if (stores.rows.length === 0) {
      console.log('❌ لم يتم العثور على متجر اسمه يحتوي على "الانيق" أو "البيت"');
    } else {
      stores.rows.forEach(s => {
        console.log(`  ID: ${s.id}, الاسم: ${s.store_name}, نشط: ${s.is_active}`);
      });
    }

    // Show all stores
    console.log('\n📋 جميع المتاجر الموجودة:');
    const allStores = await pool.query(
      'SELECT id, store_name, is_active FROM stores ORDER BY id'
    );
    allStores.rows.forEach(s => {
      console.log(`  ID: ${s.id} - ${s.store_name} (${s.is_active ? 'نشط' : 'غير نشط'})`);
    });

    // Check for data in topup tables for each store
    console.log('\n📊 ملخص البيانات في كل متجر:');
    for (const store of allStores.rows) {
      const topupComps = await pool.query(
        'SELECT COUNT(*) as count FROM topup_companies WHERE store_id = $1',
        [store.id]
      );
      const topupProds = await pool.query(
        'SELECT COUNT(*) as count FROM topup_products WHERE store_id = $1',
        [store.id]
      );
      const products = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE store_id = $1',
        [store.id]
      );
      const categories = await pool.query(
        'SELECT COUNT(*) as count FROM categories WHERE store_id = $1',
        [store.id]
      );

      console.log(`\n  المتجر: ${store.store_name} (ID: ${store.id})`);
      console.log(`    - شركات الرصيد: ${topupComps.rows[0].count}`);
      console.log(`    - منتجات الرصيد: ${topupProds.rows[0].count}`);
      console.log(`    - المنتجات العادية: ${products.rows[0].count}`);
      console.log(`    - الفئات: ${categories.rows[0].count}`);
    }

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

checkStore();
