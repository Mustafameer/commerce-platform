#!/usr/bin/env python3

# Read the file and search for the line
with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines")

# Search for uploadedUrls
count = 0
for i, line in enumerate(lines):
    if 'uploadedUrls' in line:
        count += 1
        print(f"Line {i+1}: {line.strip()[:100]}")
        if count >= 10:
            break

print(f"\nTotal uploadedUrls references: {count}")

# Also specifically look for the pattern we're targeting
found_pattern = False
for i, line in enumerate(lines):
    if 'uploadedUrls.push(imageUrl)' in line and 'Compressed' not in line:
        found_pattern = True
        print(f"\n✓ Found the BAD line at {i+1}:")
        print(f"  {line.strip()[:100]}")
        if i > 0:
            print(f"  Line before ({i}): {lines[i-1].strip()[:100]}")
            print(f"  Line before ({i-1}): {lines[i-2].strip()[:100]}")
        if i < len(lines) - 1:
            print(f"  Line after ({i+2}): {lines[i+1].strip()[:100]}")

if not found_pattern:
    print("\n✗ Did not find 'uploadedUrls.push(imageUrl)' - maybe it was already removed?")
