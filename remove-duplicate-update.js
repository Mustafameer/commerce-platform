const fs = require('fs');

// Read file as buffer to preserve exact encoding
const filePath = 'server.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Find the line with "Update topup_products table" and replace everything until the closing brace
const lines = content.split('\n');
const newLines = [];
let skip = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line contains the comment about Update topup_products
  if (line.includes('Update topup_products table')) {
    console.log(`Found problematic block at line ${i + 1}`);
    skip = true;
    // Add replacement comment
    newLines.push('        // NOTE: No longer updating topup_products.images - uses topup_product_images table only');
    braceCount = 0;
    continue;
  }
  
  if (skip) {
    // Count braces to find the end of the if block
    for (let char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    if (braceCount < 0) {
      skip = false;
      // This line has the closing brace of the if, don't include it
      // Just continue to next line
    }
    continue;
  }
  
  newLines.push(line);
}

// Write back
const result = newLines.join('\n');
fs.writeFileSync(filePath, result, 'utf-8');
console.log('✅ File updated successfully');
