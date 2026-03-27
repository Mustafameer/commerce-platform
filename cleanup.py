#!/usr/bin/env python3
import sys

# Read the file
with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines in file: {len(lines)}")

# Look for the pattern
new_lines = []
skip_count = 0
i = 0

while i < len(lines):
    line = lines[i]
    
    # Check if this is the uploadedUrls.push(imageUrlCompressed) line
    if 'uploadedUrls.push(imageUrlCompressed)' in line:
        new_lines.append(line)
        print(f"Found correct push at line {i+1}")
        i += 1
        
        # Add the next line (Image saved log)
        if i < len(lines):
            new_lines.append(lines[i])
            print(f"Added log at line {i+1}: {lines[i].strip()[:70]}")
            i += 1
        
        # Now skip the bad lines
        # Skip blank line
        if i < len(lines) and lines[i].strip() == '':
            print(f"Skipping blank at line {i+1}")
            i += 1
            skip_count += 1
        
        # Skip the duplicate push
        if i < len(lines) and 'uploadedUrls.push(imageUrl)' in lines[i] and 'Compressed' not in lines[i]:
            print(f"DELETING bad push at line {i+1}: {lines[i].strip()[:70]}")
            i += 1
            skip_count += 1
            
            # Skip the old console.log
            if i < len(lines):
                print(f"DELETING old log at line {i+1}: {lines[i].strip()[:70]}")
                i += 1
                skip_count += 1
        
        continue
    
    new_lines.append(line)
    i += 1

print(f"\nDeleted {skip_count} lines")
print(f"New file will have {len(new_lines)} lines")

# Write back
with open('server.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✓ File updated successfully")
