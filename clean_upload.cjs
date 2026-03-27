const fs = require('fs');
const c = fs.readFileSync('server.ts', 'utf-8');

// Find and remove the duplicate uploadedUrls.push(imageUrl) and old console.log
const lines = c.split('\n');
const newLines = [];

let skipNext = false;
for (let i = 0; i < lines.length; i++) {
  // Look for the pattern:uploadedUrls.push(imageUrlCompressed)
  // followed by console.log with "Image saved"
  // then uploadedUrls.push(imageUrl) - this is the one to skip
  
  if (lines[i].includes('uploadedUrls.push(imageUrl);') && 
      i > 0 && lines[i-2].includes('Image saved') &&
      lines[i-1].includes('console.log')) {
    // Skip this duplicate line
    console.log('Skipping line ' + (i+1) + ': ' + lines[i].trim());
    continue;
  }
  
  // Also skip the old console.log that goes with it
  if (lines[i].includes('Image processed:') && 
      i > 0 && lines[i-1].includes('uploadedUrls.push(imageUrl)')) {
    console.log('Skipping line ' + (i+1) + ': ' + lines[i].trim().substring(0, 50) + '...');
    continue;
  }
  
  newLines.push(lines[i]);
}

const newContent = newLines.join('\n');
fs.writeFileSync('server.ts', newContent, 'utf-8');
console.log('✓ Cleanup complete');

