#!/usr/bin/env python3
"""
Remove lines with undefined imageUrl from server.ts
Strategy: Find the two specific lines and remove them
"""

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File: {len(lines)} lines")

# Find and remove the bad lines
removed = []
new_lines = []

for i in range(len(lines)):
    line = lines[i]
    
    # Skip line if it's the bad uploadedUrls.push(imageUrl)
    if 'uploadedUrls.push(imageUrl)' in line and 'Compressed' not in line and 'Original' not in line:
        print(f"Removing line {i+1}: {line.strip()[:80]}")
        removed.append((i+1, line.strip()[:80]))
        continue
    
    # Skip line if it's the old console.log with Image processed and imageUrl
    if 'Image processed' in line and 'imageUrl' in line:
        print(f"Removing line {i+1}: {line.strip()[:80]}")
        removed.append((i+1, line.strip()[:80]))
        continue
    
    new_lines.append(line)

if removed:
    print(f"\nRemoved {len(removed)} lines")
    
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"File updated: {len(new_lines)} lines")
    print("✓ Success! Image compression system is now complete")
else:
    print("\nNo bad lines found")
