const pg = require('pg');
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' 
});

async function fixStoreOwnership() {
  try {
    console.log('🔧 ===== تصحيح ربط المتاجر بأصحابها =====\n');

    // 1. احصل على البيانات الحالية
    console.log('📋 البيانات الحالية:');
    const users = await pool.query('SELECT id, name, phone, password FROM users WHERE role = $1 ORDER BY id', ['merchant']);
    users.rows.forEach(u => {
      console.log(`   ID: ${u.id}, الاسم: ${u.name}, الهاتف: ${u.phone}, كلمة المرور: ${u.password}`);
    });

    const stores = await pool.query('SELECT id, store_name, owner_id, store_type FROM stores ORDER BY id');
    console.log('\n🏪 المتاجر:');
    stores.rows.forEach(s => {
      console.log(`   ID: ${s.id}, المتجر: ${s.store_name}, owner_id: ${s.owner_id}, النوع: ${s.store_type}`);
    });

    console.log('\n\n🔄 التصحيحات المطلوبة:\n');

    // 2. احصل على علي الهادي ومتجر الشحن
    const aliAlhadi = users.rows.find(u => u.name === 'علي الهادي');
    const topmupStore = stores.rows.find(s => s.store_type === 'topup');
    
    if (aliAlhadi && topmupStore) {
      console.log(`1️⃣ ربط علي الهادي (ID: ${aliAlhadi.id}) بمتجر الشحن (ID: ${topmupStore.id})`);
      console.log(`   الهاتف: ${aliAlhadi.phone}`);
      console.log(`   كلمة المرور: ${aliAlhadi.password}`);
      
      // تحديث المتجر
      await pool.query(
        'UPDATE stores SET owner_id = $1 WHERE id = $2',
        [aliAlhadi.id, topmupStore.id]
      );
      
      // تحديث المستخدم
      await pool.query(
        'UPDATE users SET store_id = $1 WHERE id = $2',
        [topmupStore.id, aliAlhadi.id]
      );
      
      console.log(`   ✅ تم التحديث\n`);
    }

    // 3. احصل على مصطفى ومتجر البيت الانيق
    const mustafa = users.rows.find(u => u.name === 'مصطفى');
    const baytAneeq = stores.rows.find(s => s.store_name === 'البيت الانيق');
    
    if (mustafa && baytAneeq) {
      console.log(`2️⃣ ربط مصطفى (ID: ${mustafa.id}) بمتجر البيت الانيق (ID: ${baytAneeq.id})`);
      console.log(`   الهاتف: ${mustafa.phone}`);
      console.log(`   كلمة المرور: ${mustafa.password}`);
      
      // تحديث المتجر
      await pool.query(
        'UPDATE stores SET owner_id = $1 WHERE id = $2',
        [mustafa.id, baytAneeq.id]
      );
      
      // تحديث المستخدم
      await pool.query(
        'UPDATE users SET store_id = $1 WHERE id = $2',
        [baytAneeq.id, mustafa.id]
      );
      
      console.log(`   ✅ تم التحديث\n`);
    }

    // 4. التحقق من النتائج
    console.log('\n✅ ===== البيانات بعد التصحيح =====\n');
    
    const verifyStores = await pool.query(
      'SELECT s.id, s.store_name, s.store_type, u.name, u.phone, u.password FROM stores s LEFT JOIN users u ON s.owner_id = u.id ORDER BY s.id'
    );
    
    verifyStores.rows.forEach(row => {
      console.log(`🏪 ${row.store_name}`);
      console.log(`   - النوع: ${row.store_type || 'عام'}`);
      console.log(`   - المالك: ${row.name || 'لا يوجد'}`);
      console.log(`   - الهاتف: ${row.phone || '-'}`);
      console.log(`   - كلمة المرور: ${row.password || '-'}`);
      console.log();
    });

    console.log('🎯 بيانات الدخول:');
    if (aliAlhadi) console.log(`\n🔐 متجر الشحن (علي الهادي):`);
    if (aliAlhadi) console.log(`   📱 الهاتف: ${aliAlhadi.phone}`);
    if (aliAlhadi) console.log(`   🔐 كلمة المرور: ${aliAlhadi.password}`);
    
    if (mustafa) console.log(`\n🔐 متجر البيت الانيق (مصطفى):`);
    if (mustafa) console.log(`   📱 الهاتف: ${mustafa.phone}`);
    if (mustafa) console.log(`   🔐 كلمة المرور: ${mustafa.password}`);

    await pool.end();
  } catch(err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

fixStoreOwnership();
