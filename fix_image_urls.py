#!/usr/bin/env python3
"""
Remove the undefined imageUrl variable from uploadedUrls.push
The issue: after pushing imageUrlCompressed correctly,
there's another push and console.log that reference undefined 'imageUrl'
"""

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Original file: {len(lines)} lines\n")

# Strategy: Find lines with uploadedUrls.push(imageUrlCompressed)
# Then look for the problematic uploadedUrls.push(imageUrl) that follows it

lines_to_remove = []

for i in range(len(lines) - 1):
    # Look for the correct push
    if 'uploadedUrls.push(imageUrlCompressed)' in lines[i]:
        print(f"Found correct push at line {i+1}: {lines[i].strip()[:80]}")
        
        # Check the next few lines for the bad push
        for j in range(i+1, min(i+5, len(lines))):
            line = lines[j]
            # Look for uploadedUrls.push(imageUrl) but NOT imageUrlCompressed or imageUrlOriginal
            if ('uploadedUrls.push(imageUrl)' in line and 
                'Compressed' not in line and 
                'Original' not in line and
                'imageUrl[' not in line):  # Avoid array access like imageUrl[0]
                print(f"  Found bad push at line {j+1}: {line.strip()[:80]}")
                lines_to_remove.append(j)
            
            # Also look for associated old console.log
            elif 'Image processed:' in line and j > i:
                print(f"  Found old console.log at line {j+1}: {line.strip()[:80]}")
                lines_to_remove.append(j)
                break  # Old format console.log comes after the push

# Remove duplicates and sort in reverse
lines_to_remove = sorted(set(lines_to_remove), reverse=True)

if lines_to_remove:
    print(f"\nRemoving {len(lines_to_remove)} lines:")
    for idx in lines_to_remove:
        print(f"  Line {idx+1}: {lines[idx].strip()[:80]}")
        lines.pop(idx)
    
    # Write back
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"\nNew file: {len(lines)} lines")
    print("✓ Successfully removed problematic code")
else:
    print("\nNo problematic lines found")
