#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find uploadedUrls.push(imageUrl) and show surrounding lines
for i in range(len(lines)):
    if 'uploadedUrls.push(imageUrl)' in lines[i]:
        print(f"Found at line {i+1}")
        print(f"Context (lines {i+1}-{i+7}):")
        for j in range(i-2, min(i+5, len(lines))):
            print(f"  {j+1:5d}: {lines[j].rstrip()[:110]}")
        
        print(f"\nFull line: {repr(lines[i])[:250]}")
        break
