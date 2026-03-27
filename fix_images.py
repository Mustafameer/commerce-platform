#!/usr/bin/env python3
import re

filePath = 'server.ts'

# Read the file
with open(filePath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find old code pattern using regex that's more flexible with special characters
# Look for the pattern: uploadedUrls.push(imageUrl);
# and work backwards to find the entire block

# Find the unique, reliable markers
pattern = r'(            if \(hashCheckResult\.rows\.length > 0\) \{.*?uploadedUrls\.push\(imageUrl\);)'
match = re.search(pattern, content, re.DOTALL)

if not match:
    print('Pattern not found with aggressive regex')
    # Try simpler pattern
    if 'uploadedUrls.push(imageUrl)' in content:
        print('Found uploadedUrls.push(imageUrl)')
    if 'INSERT INTO topup_product_images' in content:
        print('Found INSERT')
else:
    print('Found match, length:', len(match.group(1)))
    start_pos = match.start(1)
    end_pos = match.end(1)
    
    old_section = content[start_pos:end_pos]
    print(f'Old section ({len(old_section)} chars):')
    print(old_section[:200])
    
    new_section = '''            if (hashCheckResult.rows.length > 0) {
              // Image already exists - don't upload
              duplicateUrls.push(file.originalname);
              console.log('Duplicate found');
              continue;
            }

            // Save original file to filesystem
            await new Promise((resolve, reject) => {
              fs.writeFile(filePath, buffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Create compressed version using sharp (quality 70)
            let compressedBuffer = buffer;
            try {
              compressedBuffer = await sharp(buffer)
                .jpeg({ quality: 70, progressive: true })
                .toBuffer();
            } catch (e) {
              console.log('Compression failed');
            }

            // Save compressed version
            const compressedFileName = `${baseName}-${timestamp}-${randomStr}-compressed${ext}`;
            const compressedFilePath = path.join(uploadsDir, compressedFileName);
            
            await new Promise((resolve, reject) => {
              fs.writeFile(compressedFilePath, compressedBuffer, (err) => {
                if (err) reject(err);
                else resolve(true);
              });
            });

            // Store both URLs
            const imageUrlCompressed = `/uploads/topup/${store_id}/${topup_product_id}/${compressedFileName}`;
            const imageUrlOriginal = `/uploads/topup/${store_id}/${topup_product_id}/${fileName}`;
            const imageBase64 = buffer.toString('base64');
            
            await pool.query(
              `INSERT INTO topup_product_images (topup_product_id, image_data, image_url, image_url_original, image_hash, image_type)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [topup_product_id, imageBase64, imageUrlCompressed, imageUrlOriginal, imageHash, file.mimetype]
            );

            uploadedUrls.push(imageUrlCompressed);'''
    
    new_content = content[:start_pos] + new_section + content[end_pos:]
    
    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print('✓ File updated')
