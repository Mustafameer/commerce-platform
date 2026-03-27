#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Look for lines containing uploadedUrls.push anywhere
print("Lines with uploadedUrls.push:")
for i, line in enumerate(lines):
    if 'uploadedUrls.push' in line:
        print(f"  {i+1}: {repr(line.rstrip())[:150]}")

print("\nLines with 'Store compressed version':")
for i, line in enumerate(lines):
    if 'Store compressed version' in line:
        print(f"  {i+1}: {line.strip()[:100]}")
        # Print next 5 lines
        for j in range(i+1, min(i+6, len(lines))):
            print(f"    {j+1}: {repr(lines[j].rstrip())[:150]}")
        break
