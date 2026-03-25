const fs = require('fs');

const filePath = 'server.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the line with "Update topup_products table" and remove the if-else block
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Update topup_products table with image URLs')) {
    startLine = i - 1; // Include the comment
    break;
  }
}

if (startLine === -1) {
  console.log('Pattern not found');
  process.exit(1);
}

// Find the end of the if-else block by counting braces
let braceDepth = 0;
let endLine = startLine;
let foundEnd = false;

for (let i = startLine; i < lines.length; i++) {
  for (let char of lines[i]) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
  }
  
  // Check if we've found the matching closing brace
  if (braceDepth === 0 && i > startLine && lines[i].includes('}')) {
    endLine = i;
    foundEnd = true;
    break;
  }
}

if (!foundEnd) {
  console.log('Could not find matching brace');
  process.exit(1);
}

// Replace the entire block with a comment
const newLines = [
  ...lines.slice(0, startLine),
  '        // NOTE: Single source of truth is topup_product_images table only',
  ...lines.slice(endLine + 1)
];

fs.writeFileSync(filePath, newLines.join('\n'));
console.log(`✅ Removed duplicate image update code (lines ${startLine + 1}-${endLine + 1})`);
process.exit(0);
