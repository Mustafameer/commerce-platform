import os
import sys

os.chdir(r'c:\Users\Hp\Desktop\commerce-platform')

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line number containing "Save to local filesystem"
for i, line in enumerate(lines):
    if 'Save to local filesystem' in line:
        print(f"Found at line {i+1}: {line.strip()}")
        # Show surrounding lines
        for j in range(max(0, i-2), min(len(lines), i+15)):
            print(f"  {j+1}: {lines[j].rstrip()}")
        break
