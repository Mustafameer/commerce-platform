#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('analyze_output.txt', 'w', encoding='utf-8') as out:
    out.write(f"File: {len(lines)} lines\n\n")

    # Find ALL instances of uploadedUrls.push
    push_lines = []
    for i, line in enumerate(lines):
        if 'uploadedUrls.push' in line:
            push_lines.append((i, line.strip()))

    out.write(f"Found {len(push_lines)} uploadedUrls.push statements:\n")
    for idx, line_text in push_lines:
        out.write(f"  Line {idx+1}: {line_text[:150]}\n")

    # Check for references to undefined variable imageUrl
    out.write(f"\nLooking for undefined 'imageUrl' variable:\n")
    count = 0
    for i, line in enumerate(lines):
        if 'imageUrl' in line and 'Compressed' not in line and 'Original' not in line:
            count += 1
            if count <= 10:
                out.write(f"  Line {i+1}: {line.strip()[:150]}\n")
    
    out.write(f"\nTotal undefined imageUrl references: {count}\n")

print("Analysis written to analyze_output.txt")
