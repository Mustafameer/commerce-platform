import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost/multi_ecommerce'
});

/**
 * تحويل منتج عادي من متجر عادي إلى مزاد
 * 
 * المتطلبات:
 * ✓ في المتاجر العادية حصراً (ليس متاجر التوبأب)
 * ✓ السعر يظهر تلقائياً من product.price → starting_price
 * ✓ حفظ التاريخ وساعة البداية والنهاية في الأعمدة الصحيحة
 * ✓ تطابق الأعمدة مع جداول قاعدة البيانات الفعلية
 * 
 * الأعمدة المستخدمة:
 * └─ auctions table:
 *    ├─ auction_date (DATE) - من معامل date
 *    ├─ auction_start_time (TIME) - من معامل startTime
 *    ├─ auction_end_time (TIME) - من معامل endTime
 *    ├─ starting_price (DECIMAL) - من product.price تلقائياً
 *    └─ current_highest_price (DECIMAL) - يبدأ من starting_price
 * └─ products table:
 *    ├─ is_auction (BOOLEAN) - يصبح true
 *    └─ auction_id (INTEGER) - معرّف المزاد المرتبط
 * 
 * @param {number} productId - معرّف المنتج
 * @param {string} auctionDate - تاريخ المزاد بصيغة YYYY-MM-DD
 * @param {string} startTime - وقت البداية بصيغة HH:MM
 * @param {string} endTime - وقت النهاية بصيغة HH:MM
 * @returns {object} {success: boolean, product, auction} أو {success: false, error}
 */
async function convertProductToAuction(productId, auctionDate, startTime, endTime) {
  try {
    console.log('\n🔄 تحويل المنتج إلى مزاد...\n');
    
    // ═══════════════════════════════════════════════════════════
    // الخطوة 1: جلب بيانات المنتج والتحقق من وجوده
    // ═══════════════════════════════════════════════════════════
    // نحتاج إلى: id, store_id, name, price
    // أسباب هذا الخطوة:
    // - التأكد من أن المنتج موجود فعلاً
    // - معرفة المتجر التابع له (سيُحفظ في auctions.store_id)
    // - السعر سيُنقل تلقائياً إلى starting_price
    const productResult = await pool.query(
      `SELECT id, store_id, name, price FROM products WHERE id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error(`❌ المنتج #${productId} غير موجود`);
    }

    const product = productResult.rows[0];
    console.log(`✓ تم العثور على المنتج: ${product.name}`);
    console.log(`  السعر: ${product.price}`);
    console.log(`  معرّف المتجر: ${product.store_id}`);

    // Step 2: التحقق من أن المتجر عادي (ليس توبأب)
    console.log(`\n🏪 Step 2: التحقق من نوع المتجر...`);
    const storeResult = await pool.query(
      `SELECT id, store_type FROM stores WHERE id = $1`,
      [product.store_id]
    );

    if (storeResult.rows.length === 0) {
      throw new Error(`❌ المتجر #${product.store_id} غير موجود`);
    }

    const store = storeResult.rows[0];
    
    if (store.store_type === 'topup') {
      throw new Error(`❌ لا يمكن تحويل منتج من متجر توبأب إلى مزاد. المتاجر العادية حصراً!`);
    }

    console.log(`✓ نوع المتجر: ${store.store_type} (عادي - مقبول)`);

    // Step 3: التحقق من صيغة التاريخ والوقت
    console.log(`\n⏰ Step 3: التحقق من صيغة التاريخ والأوقات...`);
    
    // تنسيق التاريخ: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(auctionDate)) {
      throw new Error(`❌ صيغة التاريخ غير صحيحة. المتوقع: YYYY-MM-DD (مثال: 2026-03-22)\nتم استقباله: ${auctionDate}`);
    }

    // تنسيق الوقت: HH:MM (بصيغة 24 ساعة)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      throw new Error(`❌ صيغة وقت البداية غير صحيحة. المتوقع: HH:MM\nتم استقباله: ${startTime}`);
    }
    if (!timeRegex.test(endTime)) {
      throw new Error(`❌ صيغة وقت النهاية غير صحيحة. المتوقع: HH:MM\nتم استقباله: ${endTime}`);
    }

    // التحقق من أن وقت النهاية > وقت البداية
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error(`❌ وقت النهاية يجب أن يكون بعد وقت البداية!\nالبداية: ${startTime}\nالنهاية: ${endTime}`);
    }

    console.log(`✓ التاريخ: ${auctionDate}`);
    console.log(`✓ وقت البداية: ${startTime}`);
    console.log(`✓ وقت النهاية: ${endTime}`);

    // Step 4: التحقق من أن المنتج لم يكن مزاداً من قبل
    console.log(`\n🔍 Step 4: التحقق من حالة المنتج الحالية...`);
    if (product.is_auction) {
      console.log(`⚠️ تحذير: هذا المنتج مزاد بالفعل (auction_id: ${product.auction_id})`);
      console.log(`   سيتم استبدال المزاد السابق...`);
    } else {
      console.log(`✓ المنتج غير مزاد حالياً - جاهز للتحويل`);
    }

    // Step 5: إنشاء سجل المزاد
    console.log(`\n📝 Step 5: إنشاء سجل المزاد...`);
    
    const auctionResult = await pool.query(
      `INSERT INTO auctions (
        product_id, 
        store_id, 
        auction_date, 
        auction_start_time, 
        auction_end_time, 
        starting_price,
        current_highest_price,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, product_id, auction_date, auction_start_time, auction_end_time, starting_price, status`,
      [
        product.id,
        product.store_id,
        auctionDate,
        startTime,
        endTime,
        product.price,         // السعر يُنقل من product.price تلقائياً
        product.price,         // current_highest_price يبدأ بنفس starting_price
        'pending'
      ]
    );

    const auction = auctionResult.rows[0];
    console.log(`✓ تم إنشاء سجل المزاد:`);
    console.log(`  معرّف المزاد: ${auction.id}`);
    console.log(`  معرّف المنتج: ${auction.product_id}`);
    console.log(`  سعر البداية: ${auction.starting_price}`);

    // Step 6: تحديث المنتج لربطه بالمزاد
    console.log(`\n🔗 Step 6: تحديث المنتج...`);
    
    const updateResult = await pool.query(
      `UPDATE products 
       SET is_auction = true, auction_id = $1
       WHERE id = $2
       RETURNING id, is_auction, auction_id`,
      [auction.id, product.id]
    );

    const updatedProduct = updateResult.rows[0];
    console.log(`✓ تم تحديث المنتج:`);
    console.log(`  is_auction: ${updatedProduct.is_auction}`);
    console.log(`  auction_id: ${updatedProduct.auction_id}`);

    // Step 7: عرض ملخص العملية
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ تم التحويل بنجاح!`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`\n📋 ملخص المزاد:\n`);
    console.log(`  المنتج: ${product.name} (#${product.id})`);
    console.log(`  المتجر: #${store.id} (${store.store_type})`);
    console.log(`  معرّف المزاد: ${auction.id}`);
    console.log(`  سعر البداية: ${auction.starting_price} ريال`);
    console.log(`  التاريخ: ${auction.auction_date}`);
    console.log(`  من الساعة: ${auction.auction_start_time}`);
    console.log(`  إلى الساعة: ${auction.auction_end_time}`);
    console.log(`  الحالة: ${auction.status}`);
    console.log(`\n`);

    return {
      success: true,
      product: updatedProduct,
      auction: auction
    };

  } catch (error) {
    console.error(`\n❌ خطأ: ${error.message}\n`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await pool.end();
  }
}

// ============= استخدام الدالة =============

// مثال: تحويل المنتج #1 إلى مزاد
// التاريخ: 2026-03-22
// البداية: 10:00
// النهاية: 18:00

const productId = parseInt(process.argv[2]) || 1;
const auctionDate = process.argv[3] || '2026-03-22';
const startTime = process.argv[4] || '10:00';
const endTime = process.argv[5] || '18:00';

console.log(`\n🎯 معاملات الدالة:`);
console.log(`  معرّف المنتج: ${productId}`);
console.log(`  التاريخ: ${auctionDate}`);
console.log(`  وقت البداية: ${startTime}`);
console.log(`  وقت النهاية: ${endTime}`);

convertProductToAuction(productId, auctionDate, startTime, endTime);
