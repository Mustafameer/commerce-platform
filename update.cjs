#!/usr/bin/env node
const fs = require('fs');

const file = 'server.ts';
const content = fs.readFileSync(file, 'utf8');

// Find the position of the line we need to replace -looking for the exact old code
const searchText = 'uploadedUrls.push(imageUrl);';
const pos = content.indexOf(searchText);

if (pos === -1) {
  console.log('ERROR: Could not find marker');
  process.exit(1);
}

console.log(`Found marker at position ${pos}`);

// Now find the INSERT statement before it
const insertPos = content.lastIndexOf('INSERT INTO topup_product_images', pos);
const insertLine = content.substring(insertPos, insertPos + 150);
console.log('INSERT line:', insertLine.substring(0, 100), '...');

// Check if it's the old or new version
if (insertLine.includes('image_url_original')) {
  console.log('✓ Already updated!');
  process.exit(0);
}

// Find the comment above the file write
let searchBack = pos;
let lineStart = searchBack;
let count = 0;
while (searchBack > 0 && count < 200) {
  if (content[searchBack - 1] === '\n') {
    if (content.substring(searchBack, searchBack + 30).includes('Save') || 
        content.substring(searchBack, searchBack + 20).includes('fs.write')) {
      lineStart = searchBack;
      break;
    }
  }
  searchBack--;
  count++;
}

console.log(`Found line start around position ${lineStart}`);

// Find the end - the closing brace of the catch block
let searchForward = pos;
let catchEnd = searchForward;
while (searchForward < content.length && content.substring(searchForward, searchForward + 30).indexOf('} catch') === -1) {
  searchForward++;
}
catchEnd = content.indexOf('}', searchForward + 10) + 1;

console.log(`Found catch end at position ${catchEnd}`);

// Extract and show what we're replacing
const oldSection = content.substring(lineStart, catchEnd);
console.log(`\nReplacing ${oldSection.length} characters`);
console.log('Old section start: ' + oldSection.substring(0, 100).replace(/\n/g, '\\n') + '...');

// Create the new section
const newSection = `            // Save original and compressed versions
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Create compressed version for catalog (quality 70)
            let compressedBuffer = buffer;
            try {
              compressedBuffer = await sharp(buffer)
                .jpeg({ quality: 70, progressive: true })
                .toBuffer();
            } catch (e) {
              // Use original if compression fails
            }

            // Save compressed version with -compressed suffix
            const compressedFileName = \`\${baseName}-\${timestamp}-\${randomStr}-compressed\${ext}\`;
            const compressedFilePath = path.join(uploadsDir, compressedFileName);
            
            await new Promise((resolve, reject) => {
              fs.writeFile(compressedFilePath, compressedBuffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Store both URLs in database
            const imageUrlCompressed = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${compressedFileName}\`;
            const imageUrlOriginal = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${fileName}\`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              \`INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_url_original, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5, $6)\`,
              [topup_product_id, imageBase64, imageUrlCompressed, imageUrlOriginal, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrlCompressed);
            console.log('Image saved - compressed for catalog, original for purchase');
          } catch (uploadErr) {
            console.error('Error saving image:', uploadErr);
          }`;

const newContent = content.substring(0, lineStart) + newSection + content.substring(catchEnd);
fs.writeFileSync(file, newContent, 'utf8');
console.log('\n✓ File updated successfully');
