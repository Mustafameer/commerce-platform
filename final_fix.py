#!/usr/bin/env python3
"""
Remove the two problematic lines with undefined imageUrl variable
Lines 7295-7296 in the current file
"""

import sys

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines_removed = 0

# Find and remove the bad lines
# They should be after: uploadedUrls.push(imageUrlCompressed);
# and before: } catch (uploadErr) {

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Look for uploadedUrls.push(imageUrlCompressed) followed by console.log with "Image saved"
    if 'uploadedUrls.push(imageUrlCompressed)' in line:
        new_lines.append(line)  # Keep this line
        i += 1
        
        # Next line should have the Image saved console.log - keep it
        if i < len(lines) and 'Image saved' in lines[i]:
            new_lines.append(lines[i])
            i += 1
        
        # Now skip the next line if it's blank
        if i < len(lines) and lines[i].strip() == '':
            i += 1
        
        # Now skip the bad uploadedUrls.push(imageUrl) line
        if i < len(lines) and 'uploadedUrls.push(imageUrl)' in lines[i] and 'Compressed' not in lines[i]:
            print(f"Removing line {i+1}: {lines[i].strip()[:80]}")
            lines_removed += 1
            i += 1
        
        # Skip the old console.log line
        if i < len(lines) and 'Image processed' in lines[i]:
            print(f"Removing line {i+1}: {lines[i].strip()[:80]}")
            lines_removed += 1
            i += 1
        
        continue
    
    new_lines.append(line)
    i += 1

if lines_removed > 0:
    print(f"\nRemoved {lines_removed} lines")
    
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"File updated: {len(new_lines)} lines")
    print("✓ Success")
    sys.exit(0)
else:
    print("No problematic lines found")
    sys.exit(1)
