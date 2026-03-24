import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAndVerifyAuction() {
  try {
    console.log('🧪 إنشاء منتج مزاد والتحقق من البيانات\n');
    console.log('═'.repeat(70));

    // 1️⃣ إنشاء منتج مزاد
    console.log('\n📝 خطوة 1: إنشاء منتج مزاد...');
    
    const today = new Date().toISOString().split('T')[0]; // اليوم YYYY-MM-DD
    
    const productResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 5,
        category_id: 1,
        name: 'منتج اختبار 2026',
        price: 100000,
        stock: 1,
        image_url: 'https://via.placeholder.com/200',
        description: 'اختبار المزاد',
        is_auction: true,
        auction_date: today,
        auction_start_time: '09:00',
        auction_end_time: '11:00',
        auction_price: 100000
      })
    });

    const productData = await productResponse.json();
    const productId = productData.product?.id;
    console.log(`✅ تم إنشاء المنتج: ID = ${productId}`);

    // 2️⃣ التحقق من البيانات في جدول products
    console.log('\n📋 خطوة 2: التحقق من جدول products...');
    const productCheck = await pool.query(
      'SELECT id, name, is_auction, auction_id FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows[0]) {
      console.log('✅ المنتج موجود في قاعدة البيانات:');
      console.log(`   ID: ${productCheck.rows[0].id}`);
      console.log(`   الاسم: ${productCheck.rows[0].name}`);
      console.log(`   is_auction: ${productCheck.rows[0].is_auction}`);
      console.log(`   auction_id: ${productCheck.rows[0].auction_id}`);
    }

    // 3️⃣ التحقق من جدول auctions - البيانات الخام
    console.log('\n🔍 خطوة 3: التحقق من جدول auctions (البيانات الخام)...');
    const auctionRaw = await pool.query(
      `SELECT 
         id, 
         product_id, 
         auction_date, 
         auction_start_time, 
         auction_end_time, 
         starting_price,
         status
       FROM auctions WHERE product_id = $1`,
      [productId]
    );

    if (auctionRaw.rows[0]) {
      const a = auctionRaw.rows[0];
      console.log('✅ المزاد موجود! البيانات الخام:');
      console.log(`   ID: ${a.id}`);
      console.log(`   Product ID: ${a.product_id}`);
      console.log(`   auction_date (Raw): ${JSON.stringify(a.auction_date)}`);
      console.log(`   auction_start_time (Raw): ${JSON.stringify(a.auction_start_time)}`);
      console.log(`   auction_end_time (Raw): ${JSON.stringify(a.auction_end_time)}`);
      console.log(`   starting_price: ${a.starting_price}`);
      console.log(`   status: ${a.status}`);
    } else {
      console.log('❌ لم يتم إنشاء المزاد!');
    }

    // 4️⃣ التحقق من جدول auctions - مع formatting
    console.log('\n📅 خطوة 4: التحقق من جدول auctions (مع formatting)...');
    const auctionFormatted = await pool.query(
      `SELECT 
         id, 
         product_id,
         auction_date::text as auction_date_text,
         to_char(auction_date, 'YYYY-MM-DD') as auction_date_formatted,
         auction_start_time::text as auction_start_time_text,
         to_char(auction_start_time, 'HH24:MI') as auction_start_time_formatted,
         auction_end_time::text as auction_end_time_text,
         to_char(auction_end_time, 'HH24:MI') as auction_end_time_formatted,
         starting_price
       FROM auctions WHERE product_id = $1`,
      [productId]
    );

    if (auctionFormatted.rows[0]) {
      const a = auctionFormatted.rows[0];
      console.log('✅ البيانات المُنسقة:');
      console.log(`   التاريخ الخام: ${a.auction_date_text}`);
      console.log(`   التاريخ المُنسق: ${a.auction_date_formatted}`);
      console.log(`   وقت البداية الخام: ${a.auction_start_time_text}`);
      console.log(`   وقت البداية المُنسق: ${a.auction_start_time_formatted}`);
      console.log(`   وقت النهاية الخام: ${a.auction_end_time_text}`);
      console.log(`   وقت النهاية المُنسق: ${a.auction_end_time_formatted}`);
      console.log(`   السعر: ${a.starting_price}`);
    }

    // 5️⃣ التحقق من API /api/auctions/active
    console.log('\n🌐 خطوة 5: التحقق من API /api/auctions/active...');
    const apiResponse = await fetch('http://localhost:3000/api/auctions/active');
    const apiAuctions = await apiResponse.json();
    
    const myAuction = apiAuctions.find(a => a.product_id === productId);
    if (myAuction) {
      console.log('✅ المزاد موجود في API! البيانات المُرسلة:');
      console.log(`   Product Name: ${myAuction.product_name}`);
      console.log(`   auction_date: ${myAuction.auction_date}`);
      console.log(`   auction_start_time: ${myAuction.auction_start_time}`);
      console.log(`   auction_end_time: ${myAuction.auction_end_time}`);
      console.log(`   starting_price: ${myAuction.starting_price}`);
      console.log(`   status: ${myAuction.status}`);
    } else {
      console.log('❌ المزاد غير موجود في API!');
    }

    // 6️⃣ التحقق من API /api/auctions?productId=xxx
    console.log('\n🌐 خطوة 6: التحقق من API /api/auctions?productId=${productId}...');
    const editFormResponse = await fetch(`http://localhost:3000/api/auctions?productId=${productId}`);
    const editFormData = await editFormResponse.json();

    if (editFormData) {
      console.log('✅ بيانات نموذج التعديل:');
      console.log(`   auction_date: ${editFormData.auction_date}`);
      console.log(`   auction_start_time: ${editFormData.auction_start_time}`);
      console.log(`   auction_end_time: ${editFormData.auction_end_time}`);
    } else {
      console.log('❌ لم يتم الحصول على بيانات نموذج التعديل!');
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ اكتمل الفحص!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAndVerifyAuction();
