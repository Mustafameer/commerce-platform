#!/usr/bin/env python3

# This script removes the problematic lines:
# uploadedUrls.push(imageUrl);  (line with undefined variable)
# console.log(...Image processed...);  (old format log)

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Original file: {len(lines)} lines")

# Find the bad lines
bad_lines = []
for i, line in enumerate(lines):
    # Look for the specific bad push statement
    if 'uploadedUrls.push(imageUrl)' in line and 'Compressed' not in line and 'Original' not in line:
        print(f"Found bad uploadedUrls.push at line {i+1}")
        bad_lines.append(i)
    
    # Look for the old Image processed log
    elif 'Image processed:' in line and 'imageUrl' in line:
        print(f"Found old console.log at line {i+1}")
        bad_lines.append(i)

print(f"Will remove {len(bad_lines)} lines: {[i+1 for i in bad_lines]}\n")

if bad_lines:
    # Remove lines in reverse order to preserve indices
    for i in sorted(bad_lines, reverse=True):
        deleted = lines.pop(i)
        print(f"Deleted line {i+1}: {deleted.strip()[:70]}")
    
    # Write back
    with open('server.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"\nNew file: {len(lines)} lines")
    print("✓ File cleaned successfully")
else:
    print("  No problematic lines found to remove")
