import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function optimizeStorage() {
  try {
    console.log('🗜️ استراتيجية توفير المساحة\n');
    console.log('=' .repeat(60));
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ مجلد الصور غير موجود');
      process.exit(1);
    }
    
    // 1️⃣ قائمة الصور الحالية
    console.log('\n1️⃣ تحليل الصور الموجودة:\n');
    
    const files = fs.readdirSync(uploadsDir);
    let totalSize = 0;
    const filesByHash = {};
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      const sizeKB = stat.size / 1024;
      totalSize += stat.size;
      
      // حساب hash الملف
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      if (!filesByHash[hash]) {
        filesByHash[hash] = [];
      }
      filesByHash[hash].push({ file, size: stat.size });
    }
    
    console.log(`  📦 إجمالي الملفات: ${files.length}`);
    console.log(`  💾 المساحة المستخدمة: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    // 2️⃣ كشف الصور المكررة
    console.log('\n2️⃣ البحث عن صور مكررة:\n');
    
    let duplicateCount = 0;
    let wastedSpace = 0;
    
    for (const [hash, items] of Object.entries(filesByHash)) {
      if (items.length > 1) {
        duplicateCount += items.length - 1;
        const wastedPerType = items.reduce((sum, item) => sum + item.size, 0) - items[0].size;
        wastedSpace += wastedPerType;
      }
    }
    
    if (duplicateCount === 0) {
      console.log('  ✅ لا توجد صور مكررة');
    } else {
      console.log(`  ⚠️ الصور المكررة: ${duplicateCount}`);
      console.log(`  💰 المساحة المهدرة: ${(wastedSpace / (1024 * 1024)).toFixed(2)} MB`);
    }
    
    // 3️⃣ توصيات
    console.log('\n3️⃣ استراتيجية توفير المساحة:\n');
    
    const strategies = [
      { name: 'حذف الصور المكررة', savings: wastedSpace },
      { name: 'ضغط الصور JPEG (70% جودة)', savings: totalSize * 0.3 },
      { name: 'حذف الصور القديمة (سنة)', savings: totalSize * 0.2 }
    ];
    
    strategies.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name}`);
      console.log(`     💾 توفير: ${(s.savings / (1024 * 1024)).toFixed(2)} MB\n`);
    });
    
    const totalSavings = wastedSpace + (totalSize * 0.3) + (totalSize * 0.2);
    
    console.log('=' .repeat(60));
    console.log(`\n📊 النتيجة:`);
    console.log(`  قبل: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  بعد: ${((totalSize - totalSavings) / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  توفير: ${(totalSavings / (1024 * 1024)).toFixed(2)} MB (${((totalSavings / totalSize) * 100).toFixed(0)}%)\n`);
    
    console.log('✅ الخطوات الموصى بها:');
    console.log('  1. npm install sharp');
    console.log('  2. استخدام Dropbox API للـ Backup\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

optimizeStorage();
