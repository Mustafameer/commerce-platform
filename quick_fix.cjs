const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

// Remove the DELETE statement
const fixed = content
  .replace(
    /\/\/ ً.*?DELETE from topup_product_images.*?console\.log\(`ً.*?Deleted image.*?\);/gs,
    '// Image now stored as original'
  )
  .replace(
    /\/\/ Update product with remaining images[\s\S]*?console\.log\(`.*?Topup product images updated[\s\S]*?\);/,
    ''
  );

fs.writeFileSync('server.ts', fixed, 'utf8');
console.log('✓ Fixed');
