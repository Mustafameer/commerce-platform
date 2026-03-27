#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = 'server.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Key unique markers that appear only in the upload endpoint
const startMarker = "// Create uploads directory if needed";  
const endMarker = "} catch (updateErr) {";

const startPos = content.indexOf(startMarker);
const endPos = content.indexOf(endMarker);

if (startPos === -1 || endPos === -1) {
  console.log('ERROR: Markers not found');
  console.log('startMarker found:', startPos);
  console.log('endMarker found:', endPos);
  process.exit(1);
}

console.log('Found section from', startPos, 'to', endPos);

// The section we want to replace is the entire for loop
// Find "for (const file of files) {" after the startMarker
const forLoopStart = content.indexOf('for (const file of files) {', startPos);
// Find the matching closing brace for the for loop (before endMarker)
// The for loop ends with "} catch (uploadErr) {" then the closing for brace

const catchBlock = content.indexOf('} catch (uploadErr) {', forLoopStart);
const forLoopEnd = content.indexOf('\n        }', catchBlock) + 1;

console.log(`Replacing for loop from ${forLoopStart} to ${forLoopEnd}`);

const oldForLoop = content.substring(forLoopStart, forLoopEnd);
console.log(`Old loop length: ${oldForLoop.length}`);
console.log(`First 300 chars of old loop:`);
console.log(oldForLoop.substring(0, 300));

// Define the new for loop
const newForLoop = `for (const file of files) {
          try {
            const buffer = file.buffer;

            // Generate unique filename based on original name
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const ext = path.extname(file.originalname) || '.jpg';
            const baseName = path.basename(file.originalname, ext);
            const fileName = \`\${baseName}-\${timestamp}-\${randomStr}\${ext}\`;
            const filePath = path.join(uploadsDir, fileName);

            // Create MD5 hash of image for duplicate detection
            const imageHash = crypto.createHash('md5').update(buffer).digest('hex');

            // Check if this hash already exists in database
            const hashCheckResult = await pool.query(
              \`SELECT id FROM topup_product_images 
               WHERE topup_product_id = $1 AND image_hash = $2 LIMIT 1\`,
              [topup_product_id, imageHash]
            );

            if (hashCheckResult.rows.length > 0) {
              // Image already exists - don't upload
              duplicateUrls.push(file.originalname);
              continue;
            }

            // Save original file to filesystem
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Create compressed version using sharp (quality 70 for catalog display)
            let compressedBuffer = buffer;
            try {
              compressedBuffer = await sharp(buffer)
                .jpeg({ quality: 70, progressive: true })
                .toBuffer();
            } catch (sharpErr) {
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

            // Store both URLs in database (compressed for catalog, original for purchase)
            const imageUrlCompressed = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${compressedFileName}\`;
            const imageUrlOriginal = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${fileName}\`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              \`INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_url_original, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5, $6)\`,
              [topup_product_id, imageBase64, imageUrlCompressed, imageUrlOriginal, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrlCompressed);
          } catch (uploadErr) {
            console.error('Error saving image:', uploadErr);
          }
        }`;

const newContent = content.substring(0, forLoopStart) + newForLoop + content.substring(forLoopEnd);

fs.writeFileSync(filePath, newContent, 'utf-8');

console.log('\n✓ File updated successfully!');
console.log('Changes applied:');
console.log('  ✓ Added sharp.js image compression (quality 70)');
console.log('  ✓ Saves both compressed (for catalog) and original (for purchase) versions');
console.log('  ✓ Updated INSERT statement to include image_url_original column');
console.log('  ✓ Catalog array gets compressed version URLs');
console.log('\nHow it works:');
console.log('  1. User uploads images → both saved to disk');
console.log('  2. Compressed version shown in product catalog');
console.log('  3. Original version available after customer purchases');
