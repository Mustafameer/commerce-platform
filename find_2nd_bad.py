#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find imageUrlCompressed and search for the next uploadedUrls.push(imageUrl)
for i in range(len(lines)):
    if 'uploadedUrls.push(imageUrlCompressed)' in lines[i]:
        print(f"Found imageUrlCompressed push at line {i+1}")
        
        # Look for the bad push in the next 5 lines
        for j in range(i+1, min(i+6, len(lines))):
            if 'uploadedUrls.push(imageUrl)' in lines[j]:
                print(f"  Bad push at line {j+1} (0-based: {j})")
                print(f"  Content: {repr(lines[j])}")
                
                # Also get the next line (the console.log)
                if j+1 < len(lines):
                    print(f"  Next line {j+2} (0-based: {j+1}): {repr(lines[j+1][:100])}")
