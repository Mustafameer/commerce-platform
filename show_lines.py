#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"File has {len(lines)} lines\n")

# Find lines 7290-7300 area and print them
for i in range(7285, min(7305, len(lines))):
    print(f"{i+1:5d}: {repr(lines[i].rstrip())[:150]}")
