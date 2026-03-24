import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function debug() {
  try {
    console.log('\n🔍 تشخيص المتاجر:\n');
    
    // 1. Check what's in database
    console.log('1️⃣ جميع البيانات في قاعدة البيانات:');
    const dbStores = await pool.query('SELECT id, store_name, status, is_active, owner_id FROM stores ORDER BY id DESC');
    console.table(dbStores.rows);
    
    // 2. Check what API should return
    console.log('\n2️⃣ ما يجب أن يعيده /api/admin/stores:');
    const apiStores = await pool.query(`
      SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone, owner_id, owner_email, percentage_enabled, subscription_paid, commission_percentage
      FROM stores
      ORDER BY 
        CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'suspended' THEN 3 
          ELSE 4 
        END,
        created_at DESC
      LIMIT 100 OFFSET 0
    `);
    console.log(`عدد المتاجر: ${apiStores.rows.length}`);
    apiStores.rows.forEach(s => {
      console.log(`  - ID:${s.id} | ${s.store_name} | Status:${s.status} | Active:${s.is_active}`);
    });
    
    // 3. Check filter logic
    console.log('\n3️⃣ اختبار منطق التصفية:');
    apiStores.rows.forEach(s => {
      const isVisible = true; // لا توجد استعلام بحث
      console.log(`  ID:${s.id} | يجب أن يظهر: ${isVisible}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('خطأ:', error);
  }
}

debug();
