import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * Generate a simple test image (small PNG)
 */
function generateTestImage() {
  // Simple PNG header (1x1 pixel red)
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, // image data
    0x49, 0xb4, 0xe8, 0xb7, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return png.toString('base64');
}

(async () => {
  try {
    console.log('🖼️  إنشاء صورة اختبارية...\n');
    const base64Image = generateTestImage();
    console.log('✅ تم إنشاء صورة اختبارية (1x1 pixel PNG)');
    console.log(`   حجم البيانات: ${base64Image.length} حرف\n`);

    // Upload to server
    console.log('📤 رفع الصورة للمنتج #3...\n');
    
    const response = await fetch('http://localhost:3000/api/topup/upload-images-firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: 3,
        topup_product_id: 3,
        images: [`data:image/png;base64,${base64Image}`]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ تم رفع الصورة بنجاح!\n');
      console.log('📋 التفاصيل:');
      console.log(`   الرسالة: ${data.message}`);
      console.log('');
      console.log('🔗 روابط الصور:');
      data.image_urls.forEach((url, idx) => {
        console.log(`   ${idx + 1}. ${url}`);
        
        // Show full URL for local images
        if (url.startsWith('/uploads')) {
          console.log(`      رابط كامل: http://localhost:3000${url}`);
        }
      });
    } else {
      console.log('❌ فشل رفع الصورة:');
      console.log(JSON.stringify(data, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
})();
