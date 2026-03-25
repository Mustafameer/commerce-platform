const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// Find and remove the 'images' handling from the PUT endpoint
// Replace the part that handles images destructuring and updates

// First, find the line with image destructuring in PUT endpoint
const putRegex = /const\s+{\s*id\s*}\s*=\s*req\.params;[\s\S]*?const\s+{\s*amount,\s*price,\s*bulk_price,\s*retail_price,\s*wholesale_price,\s*available_codes,\s*images\s*}\s*=\s*req\.body;/;
const putReplacement = `const { id } = req.params;
        // Extract only product metadata fields - explicitly ignore 'images' to prevent duplication
        const { amount, price, bulk_price, retail_price, wholesale_price, available_codes } = req.body;`;

content = content.replace(putRegex, putReplacement);

// Now remove the entire images handling block in PUT
const imagesBlockRegex = /\/\/\s*Handle\s*images[\s\S]*?(?=\n\s*values\.push\(id\);)/;
const commentReplacement = `// Note: 'images' field is intentionally ignored in PUT
        // Images are managed only through topup_product_images table via upload endpoint
        // This prevents the duplication issue`;

content = content.replace(imagesBlockRegex, commentReplacement);

fs.writeFileSync('server.ts', content, 'utf-8');
console.log('✅ PUT endpoint fixed - images field now ignored');
