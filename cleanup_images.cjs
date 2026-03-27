const fs = require('fs');

try {
  const content = fs.readFileSync('server.ts', 'utf-8');
  const lines = content.split(/\r?\n/);
  
  console.log('Total lines:', lines.length);
  console.log('Looking for duplicate uploadedUrls.push lines...\n');
  
  // Find the patterns we need to remove
  let indicesToDelete = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for the line with uploadedUrls.push(imageUrlCompressed)
    if (line.includes('uploadedUrls.push(imageUrlCompressed)')) {
      console.log('Line', (i + 1) + ':', line.trim().substring(0, 60));
      
      // Search the next 10 lines for the duplicate uploadedUrls.push(imageUrl)
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('uploadedUrls.push(imageUrl)') && !lines[j].includes('imageUrlCompressed') && !lines[j].includes('imageUrlOriginal')) {
          console.log('Line', (j + 1) + ':', lines[j].trim().substring(0, 60), '◄ DUPLICATE - DELETE');
          indicesToDelete.push(j);
        }
        
        // Also look for the old console.log with "Image processed" that references imageUrl
        if (lines[j].includes('Image processed') && lines[j].includes('imageUrl')) {
          console.log('Line', (j + 1) + ':', lines[j].trim().substring(0, 60), '◄ OLD LOG - DELETE');
          indicesToDelete.push(j);
        }
      }
      break;  // We found the first marker, don't need to continue
    }
  }
  
  console.log('\nTotal lines to delete:', indicesToDelete.length);
  
  if (indicesToDelete.length === 0) {
    console.log('No duplicate lines found');
  } else {
    console.log('Deleting lines:', indicesToDelete.map(i => i + 1).join(', '));
    
    // Remove in reverse order so indices don't shift
    indicesToDelete.sort((a, b) => b - a);
    const newLines = lines.filter((_, idx) => !indicesToDelete.includes(idx));
    const newContent = newLines.join('\n');
    
    fs.writeFileSync('server.ts', newContent, 'utf-8');
    console.log('✓ Successfully cleaned up server.ts\n');
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

