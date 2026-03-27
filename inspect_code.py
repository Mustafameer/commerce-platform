#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the section with "Store compressed version"
for i in range(len(lines)):
    if 'Store compressed version' in lines[i]:
        print(f"Found marker at line {i+1}\n")
        print("Next 8 lines:")
        for j in range(i, min(i+8, len(lines))):
            line = lines[j]
            print(f"{j+1:5d}: {repr(line.rstrip())}")
        break
