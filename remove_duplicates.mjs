import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function removeDuplicates() {
  try {
    console.log('🗑️ حذف الصور المكررة\n');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    const files = fs.readdirSync(uploadsDir);
    
    const filesByHash = {};
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      if (!filesByHash[hash]) {
        filesByHash[hash] = [];
      }
      filesByHash[hash].push({ file, path: filePath, size: stat.size });
    }
    
    // حذف المكررات (الاحتفاظ بالأول فقط)
    for (const [hash, items] of Object.entries(filesByHash)) {
      if (items.length > 1) {
        console.log(`\n🔄 صور متطابقة (${items.length} نسخ):`);
        items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.file}`);
        });
        
        // حذف النسخ الإضافية
        for (let i = 1; i < items.length; i++) {
          fs.unlinkSync(items[i].path);
          deletedCount++;
          freedSpace += items[i].size;
          console.log(`   ❌ تم حذف: ${items[i].file}`);
        }
      }
    }
    
    console.log(`\n✅ اكتمل:`);
    console.log(`   • الملفات المحذوفة: ${deletedCount}`);
    console.log(`   • المساحة المحررة: ${(freedSpace / (1024 * 1024)).toFixed(2)} MB`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

removeDuplicates();
