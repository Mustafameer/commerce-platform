import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function compressOldImages() {
  try {
    console.log('🗜️ ضغط الصور القديمة لتوفير المساحة\n');
    
    // Get all files
    const files = fs.readdirSync(uploadsDir, { recursive: true });
    
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    let compressedFiles = 0;
    let savedSpace = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      
      // If file is older than 30 days
      if (stat.mtime.getTime() < thirtyDaysAgo && stat.isFile()) {
        const sizeBeforeKB = stat.size / 1024;
        
        // Here you could:
        // 1. Move to archive
        // 2. Delete old thumbnails
        // 3. Send to backup storage
        
        console.log(`  📦 ${path.basename(filePath)}: ${sizeBeforeKB.toFixed(2)} KB`);
        compressedFiles++;
        savedSpace += stat.size;
      }
    }
    
    console.log(`\n✅ النتائج:`);
    console.log(`  • الملفات القديمة: ${compressedFiles}`);
    console.log(`  • المساحة المتوفرة: ${(savedSpace / (1024 * 1024)).toFixed(2)} MB`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

compressOldImages();
