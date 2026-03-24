import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

(async () => {
  try {
    // Create a topup (recharge) store
    const storeName = 'متجر الشحن - أورنج';
    const ownerName = 'مسؤول الشحن';
    const ownerPhone = '+966501111111';
    const slug = 'topup-orange';
    
    const res = await pool.query(`
      INSERT INTO stores 
      (store_name, slug, owner_name, owner_phone, store_type, status, is_active, 
       commission_percentage, percentage_enabled, subscription_paid, category, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, store_name, slug, store_type
    `, [
      storeName,           // store_name
      slug,                // slug
      ownerName,           // owner_name
      ownerPhone,          // owner_phone
      'topup',             // store_type (topup/recharge)
      'active',            // status
      true,                // is_active
      0,                   // commission_percentage (0% for topup stores)
      false,               // percentage_enabled
      true,                // subscription_paid
      'شحن ورصيد',        // category
    ]);

    if (res.rows.length > 0) {
      const store = res.rows[0];
      console.log('✅ تم إنشاء متجر الشحن بنجاح!');
      console.log('');
      console.log('📋 تفاصيل المتجر:');
      console.log('═══════════════════════════════════════');
      console.log(`🆔 معرف المتجر: ${store.id}`);
      console.log(`🏪 اسم المتجر: ${store.store_name}`);
      console.log(`🔗 الرابط: ${store.slug}`);
      console.log(`📦 النوع: ${store.store_type}`);
      console.log('═══════════════════════════════════════');
      console.log('');
      console.log('الآن يمكنك:');
      console.log('1. إضافة منتجات شحن من خلال لوحة التحكم');
      console.log('2. تحديد الفئات (أورنج، زين، موبايلي، إلخ)');
      console.log('3. إدارة أسعار الشحن');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
})();
