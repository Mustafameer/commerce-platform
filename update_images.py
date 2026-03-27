#!/usr/bin/env python3
import re

# Read the file with UTF-8 encoding
with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace section 1: Save to local filesystem + compression
old1 = """            // Save to local filesystem
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });
            console.log('âœ… File saved locally:', filePath);"""

new1 = """            // Save original file to filesystem
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
              console.log('Sharp compression failed');
            }

            // Save compressed version with -compressed suffix
            const compressedFileName = `${baseName}-${timestamp}-${randomStr}-compressed${ext}`;
            const compressedFilePath = path.join(uploadsDir, compressedFileName);
            
            await new Promise((resolve, reject) => {
              fs.writeFile(compressedFilePath, compressedBuffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });"""

if old1 in content:
    print("✓ Found and replacing section 1...")
    content = content.replace(old1, new1)
else:
    print("✗ Section 1 not found - checking for alternatives")

# Replace section 2: Database insert
old2 = """            // Store reference in database with local path
            const imageUrl = `/uploads/topup/${store_id}/${topup_product_id}/${fileName}`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              `INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5)`,
              [topup_product_id, imageBase64, imageUrl, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrl);
            console.log(`âœ… Image processed: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB) â†' ${imageUrl}`);"""

new2 = """            // Store both compressed and original URLs in database
            const imageUrlCompressed = `/uploads/topup/${store_id}/${topup_product_id}/${compressedFileName}`;
            const imageUrlOriginal = `/uploads/topup/${store_id}/${topup_product_id}/${fileName}`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              `INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_url_original, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [topup_product_id, imageBase64, imageUrlCompressed, imageUrlOriginal, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrlCompressed);
            console.log('✓ Image saved - compressed for catalog, original for purchase');"""

if old2 in content:
    print("✓ Found and replacing section 2...")
    content = content.replace(old2, new2)
else:
    print("✗ Section 2 not found")

# Write back
with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ File updated successfully")
