const fs = require('fs');
const path = require('path');

// Read the server.ts file
const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf-8');

// Find and remove the problematic UPDATE block
// Looking for the pattern where it updates topup_products.images

// The pattern to find: everything from the comment about "Update topup_products" 
// to the closing brace of the if statement
const pattern = /\/\/ .*Update topup_products table.*?\n[\s\S]*?console\.warn\('.*?No new images uploaded'\);\s*\}/m;

const beforeLength = content.length;
content = content.replace(pattern, `// NOTE: No longer updating topup_products.images directly
        // All images are retrieved from topup_product_images table (single source of truth)
        // This eliminates duplication issues`);

if (content.length === beforeLength) {
  console.log('❌ Pattern not found - trying alternative approach');
  
  // Alternative: Find the specific line numbers and replace
  const lines = content.split('\n');
  let inBlock = false;
  let blockStart = -1;
  let blockEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Update topup_products table with image URLs')) {
      inBlock = true;
      blockStart = i;
      console.log(`Found block start at line ${i + 1}`);
    }
    if (inBlock && lines[i].includes("console.warn('") && lines[i].includes('No new images uploaded')) {
      // Find the closing brace
      blockEnd = i;
      while (blockEnd < lines.length && !lines[blockEnd].includes('}')) {
        blockEnd++;
      }
      console.log(`Found block end at line ${blockEnd + 1}`);
      break;
    }
  }
  
  if (blockStart !== -1 && blockEnd !== -1) {
    console.log(`Replacing lines ${blockStart + 1} to ${blockEnd + 1}`);
    lines.splice(blockStart, blockEnd - blockStart + 1, 
      '        // NOTE: No longer updating topup_products.images directly',
      '        // All images are retrieved from topup_product_images table (single source of truth)',
      '        // This eliminates duplication issues'
    );
    content = lines.join('\n');
    console.log('✅ Block removed successfully');
  }
} else {
  console.log('✅ Pattern replaced successfully');
}

// Write the modified content back
fs.writeFileSync(serverPath, content, 'utf-8');
console.log('✅ server.ts updated successfully');
