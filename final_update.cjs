const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf-8');

//Split by "Store reference in database" phrase which is unique and appears on line 7261
const searchStr = "            // Store reference in database with local path";
const idx = content.indexOf(searchStr);

console.log('Found "Store reference" at:', idx);

if (idx > -1) {
  // Find the start: "Save to local filesystem"
  const saveStart = content.lastIndexOf("// Save to local filesystem", idx);
  console.log('Found "Save to local" at:', saveStart);
  
  // Find the end: after the catch block
  const catchStart = content.indexOf('} catch (uploadErr) {', idx);
  const catchEnd = content.indexOf('}', catchStart) + 1;
  console.log('Found catch block from', catchStart, 'to', catchEnd);
  
  if (saveStart > 0 && catchEnd > 0) {
    // Get the exact section we want to replace
    const section = content.substring(saveStart, catchEnd);
    console.log('Replacing section of length:', section.length);
    console.log('First 200 chars:', section.substring(0, 200));
    
    const newSection = `// Save original and compressed versions
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
              console.log('Compression failed, using original');
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

            // Store both compressed and original URLs in database
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
    
    const newContent = content.substring(0, saveStart) + newSection + content.substring(catchEnd);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('✓ File updated successfully!');
  } else {
    console.log('✗ Could not find surrounding markers');
  }
} else {
  console.log('✗ Could not find target string');
}
