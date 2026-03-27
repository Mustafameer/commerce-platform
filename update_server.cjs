const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');

let content = fs.readFileSync(filePath, 'utf-8');

// Simple direct replacement of the entire file section
const searchStr = '            // Save to local filesystem';
const idx = content.indexOf(searchStr);

if (idx > -1) {
  console.log('✓ Found "Save to local filesystem" at index', idx);
  
  // Find the start of the try block
  const tryStart = content.lastIndexOf('try {', idx) + 5;
  
  // Find the matching catch block
  let braceCount = 0;
  let catchStart = -1;
  for (let i = idx; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0 && content.substring(i, i+20).includes('catch')) {
        catchStart = i;
        break;
      }
    }
  }
  
  if (catchStart > 0) {
    const catchEnd = content.indexOf('}', content.indexOf('catch', catchStart)) + 1;
    const oldBlock = content.substring(idx, catchEnd);
    console.log('✓ Found block to replace, length:', oldBlock.length);
    
    const newBlock = `            // Save original and compressed versions
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
              console.log('Compression skipped');
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
            console.error('Error processing image:', uploadErr);
          }`;
    
    content = content.substring(0, idx) + newBlock + content.substring(catchEnd);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✓ File updated successfully!');
  } else {
    console.log('✗ Could not find catch block');
  }
} else {
  console.log('✗ Could not find target section');
  process.exit(1);
}
