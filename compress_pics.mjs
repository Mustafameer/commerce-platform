import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function compressImages() {
  try {
    console.log('🗜️ ضغط الصور\n');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    const files = fs.readdirSync(uploadsDir).filter(f => /\.jpg$/i.test(f));
    
    let savedSpace = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      const sizeBefore = stat.size;
      
      // ضغط
      await sharp(filePath)
        .jpeg({ quality: 75, progressive: true, mozjpeg: true })
        .toFile(filePath + '_tmp');
      
      fs.renameSync(filePath + '_tmp', filePath);
      
      const sizeAfter = fs.statSync(filePath).size;
      const saved = sizeBefore - sizeAfter;
      savedSpace += saved;
      
      console.log(`✅ ${file}: ${(sizeAfter / 1024).toFixed(0)} KB`);
    }
    
    console.log(`\n✅ توفير: ${(savedSpace / 1024).toFixed(2)} KB`);
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

compressImages();
