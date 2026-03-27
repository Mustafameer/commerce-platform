#!/usr/bin/env python3
"""
More robust fix - read lines, find the section, and rebuild it
"""

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")

# Find the line with "Store used images"
target_comment_found = False
for i, line in enumerate(lines):
    if 'Store used images in order_images table' in line:
        print(f"Found comment at line {i+1}")
        target_comment_found = True
        
        # Now we know the loop starts around line i+1
        # Find the start of the for loop
        for j in range(i, min(i+20, len(lines))):
            if 'for (const image of usedImages)' in lines[j]:
                print(f"Found for loop at line {j+1}")
                
                # Replace the loop variable name from 'image' to 'imageUrl'
                # and update the logic inside
                
                # Find the closing brace of this loop
                brace_count = 0
                loop_start = j
                loop_end = None
                
                for k in range(j, min(j+100, len(lines))):
                    if '{' in lines[k]:
                        brace_count += lines[k].count('{')
                    if '}' in lines[k]:
                        brace_count -= lines[k].count('}')
                    
                    if brace_count == 0 and k > j:
                        loop_end = k
                        print(f"Loop ends at line {k+1}")
                        break
                
                if loop_start and loop_end:
                    # Rebuild the loop
                    new_loop_lines = []
                    
                    # Keep the comment line
                    new_loop_lines.append(lines[i])
                    
                    # Add new loop with corrected logic
                    new_loop_lines.append('            for (const imageUrl of usedImages) {\n')
                    new_loop_lines.append('              try {\n')
                    new_loop_lines.append('                // Find the ORIGINAL image URL for this compressed URL\n')
                    new_loop_lines.append('                const originalImageResult = await pool.query(\n')
                    new_loop_lines.append('                  `SELECT image_url_original FROM topup_product_images \n')
                    new_loop_lines.append('                   WHERE topup_product_id = $1 AND image_url = $2\n')
                    new_loop_lines.append('                   LIMIT 1`,\n')
                    new_loop_lines.append('                  [topup_product_id, imageUrl]\n')
                    new_loop_lines.append('                );\n')
                    new_loop_lines.append('                \n')
                    new_loop_lines.append('                // Use original if found, otherwise use the URL as-is\n')
                    new_loop_lines.append('                const imageUrlToStore = originalImageResult.rows.length > 0 \n')
                    new_loop_lines.append('                  ? originalImageResult.rows[0].image_url_original \n')
                    new_loop_lines.append('                  : imageUrl;\n')
                    new_loop_lines.append('                \n')
                    new_loop_lines.append('                // Store the ORIGINAL image in order_images (not the compressed one)\n')
                    new_loop_lines.append('                await pool.query(\n')
                    new_loop_lines.append('                  `INSERT INTO order_images (order_id, topup_product_id, image_url)\n')
                    new_loop_lines.append('                   VALUES ($1, $2, $3)\n')
                    new_loop_lines.append('                   ON CONFLICT (order_id, topup_product_id, image_url) DO NOTHING`,\n')
                    new_loop_lines.append('                  [orderId, topup_product_id, imageUrlToStore]\n')
                    new_loop_lines.append('                );\n')
                    new_loop_lines.append('                \n')
                    new_loop_lines.append('                // Delete from topup_product_images (so it doesn\'t appear in catalog)\n')
                    new_loop_lines.append('                await pool.query(\n')
                    new_loop_lines.append('                  `DELETE FROM topup_product_images WHERE topup_product_id = $1 AND image_url = $2`,\n')
                    new_loop_lines.append('                  [topup_product_id, imageUrl]\n')
                    new_loop_lines.append('                );\n')
                    new_loop_lines.append('                \n')
                    new_loop_lines.append('                console.log(`Stored original image for order: ${imageUrlToStore}`);\n')
                    new_loop_lines.append('              } catch (err) {\n')
                    new_loop_lines.append('                console.error(`Error processing image: ${err}`);\n')
                    new_loop_lines.append('              }\n')
                    new_loop_lines.append('            }\n')
                    
                    # Replace the old loop with new one
                    new_lines = lines[:i] + new_loop_lines + lines[loop_end+1:]
                    
                    with open('server.ts', 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)
                    
                    print(f"✓ Successfully replaced lines {i+1}-{loop_end+1}")
                    print("  Original images will now be stored in order_images table")
                    break
        break

if not target_comment_found:
    print("Could not find the target code section")
