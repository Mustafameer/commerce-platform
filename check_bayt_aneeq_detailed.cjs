const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function detailedCheck() {
  try {
    console.log('🔍 ===== التفاصيل الكاملة لمتجر البيت الانيق =====\n');

    const storeId = 3; // ID البيت الانيق

    // Check products
    console.log('📦 المنتجات العادية:');
    const products = await pool.query(
      'SELECT id, name, price, stock FROM products WHERE store_id = $1',
      [storeId]
    );
    if (products.rows.length === 0) {
      console.log('  ❌ لا توجد منتجات عادية');
    } else {
      products.rows.forEach(p => {
        console.log(`  ID: ${p.id}, الاسم: ${p.name}, السعر: ${p.price}, المخزون: ${p.stock}`);
      });
    }

    // Check categories
    console.log('\n📂 الفئات:');
    const categories = await pool.query(
      'SELECT id, name, is_active FROM categories WHERE store_id = $1',
      [storeId]
    );
    if (categories.rows.length === 0) {
      console.log('  ❌ لا توجد فئات');
    } else {
      categories.rows.forEach(c => {
        console.log(`  ID: ${c.id}, الاسم: ${c.name}, نشطة: ${c.is_active}`);
      });
    }

    // Check orders
    console.log('\n📋 الطلبات:');
    const orders = await pool.query(
      'SELECT id, total_amount, status, created_at FROM orders WHERE store_id = $1',
      [storeId]
    );
    if (orders.rows.length === 0) {
      console.log('  ❌ لا توجد طلبات');
    } else {
      console.log(`  عدد الطلبات: ${orders.rows.length}`);
      orders.rows.forEach(o => {
        console.log(`  ID: ${o.id}, المبلغ: ${o.total_amount}, الحالة: ${o.status}`);
      });
    }

    // Check topup companies
    console.log('\n🏢 شركات الرصيد:');
    const topupComps = await pool.query(
      'SELECT id, name, is_active FROM topup_companies WHERE store_id = $1',
      [storeId]
    );
    if (topupComps.rows.length === 0) {
      console.log('  ❌ لا توجد شركات رصيد');
    } else {
      topupComps.rows.forEach(c => {
        console.log(`  ID: ${c.id}, الاسم: ${c.name}, نشطة: ${c.is_active}`);
      });
    }

    // Check topup products
    console.log('\n📱 منتجات الرصيد:');
    const topupProds = await pool.query(
      'SELECT tp.id, tc.name as company, tpc.name as category, tp.amount, tp.price FROM topup_products tp LEFT JOIN topup_companies tc ON tp.company_id = tc.id LEFT JOIN topup_product_categories tpc ON tp.category_id = tpc.id WHERE tp.store_id = $1',
      [storeId]
    );
    if (topupProds.rows.length === 0) {
      console.log('  ❌ لا توجد منتجات رصيد');
    } else {
      topupProds.rows.forEach(p => {
        console.log(`  ID: ${p.id}, شركة: ${p.company}, فئة: ${p.category}, المبلغ: ${p.amount}, السعر: ${p.price}`);
      });
    }

    // Check store details
    console.log('\n🏪 تفاصيل المتجر:');
    const store = await pool.query(
      'SELECT * FROM stores WHERE id = $1',
      [storeId]
    );
    console.log('  معلومات المتجر الكاملة:');
    console.log(store.rows[0]);

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

detailedCheck();
