const fs = require('fs');

const filePath = 'server.ts';
const content = fs.readFileSync(filePath, 'utf-8');

// Use indexOf to find key positions
// We need to find the section from "if (hashCheckResult..." to "uploadedUrls.push(imageUrl);"

// Find the duplicate check block
const dupCheckPattern = 'if (hashCheckResult.rows.length > 0) {';
const dupCheckPos = content.lastIndexOf(dupCheckPattern, 7300);  // Search near line 7250

console.log('Dup check found at:', dupCheckPos);

if (dupCheckPos === -1) {
  console.log('ERROR: Could not find duplicate check');
  process.exit(1);
}

// Find the "uploadedUrls.push(imageUrl);" that comes after this position
const pushMarker = 'uploadedUrls.push(imageUrl);';
const pushPos = content.indexOf(pushMarker, dupCheckPos);

console.log('Push found at:', pushPos);

if (pushPos === -1) {
  console.log('ERROR: Could not find push statement');
  process.exit(1);
}

// Extract the section to replace
const sectionToReplace = content.substring(dupCheckPos, pushPos + pushMarker.length);

console.log('Section length:', sectionToReplace.length);
console.log('Will show first 300 chars:');
console.log(sectionToReplace.substring(0, 300));
console.log('...');

// Create new section
const newSection = `if (hashCheckResult.rows.length > 0) {
              // Image already exists - skip  
              duplicateUrls.push(file.originalname);
              continue;
            }

            // Save original file
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Create compressed version (quality 70)
            let compressedBuffer = buffer;
            try {
              compressedBuffer = await sharp(buffer)
                .jpeg({ quality: 70, progressive: true })
                .toBuffer();
            } catch (e) {
              console.log('Compression failed');
            }

            // Save compressed file with -compressed suffix
            const compressedFileName = \`\${baseName}-\${timestamp}-\${randomStr}-compressed\${ext}\`;
            const compressedFilePath = path.join(uploadsDir, compressedFileName);
            
            await new Promise((resolve, reject) => {
              fs.writeFile(compressedFilePath, compressedBuffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Store both compressed and original URLs
            const imageUrlCompressed = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${compressedFileName}\`;
            const imageUrlOriginal = \`/uploads/topup/\${store_id}/\${topup_product_id}/\${fileName}\`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              \`INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_url_original, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5, $6)\`,
              [topup_product_id, imageBase64, imageUrlCompressed, imageUrlOriginal, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrlCompressed);`;

const newContent = content.substring(0, dupCheckPos) + newSection + content.substring(pushPos + pushMarker.length);

fs.writeFileSync(filePath, newContent, 'utf-8');

console.log('✓ File updated successfully!');
console.log('Changes made:');
console.log('  - Added sharp compression (quality 70)');
console.log('  - Saves both compressed (for catalog) and original (for purchase) versions');
console.log('  - Updated INSERT to include image_url_original column');
console.log('  - Uploads compressed version to catalog array');
