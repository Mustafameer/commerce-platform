#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Original: {len(lines)} lines\n")

# Delete lines 7270 and 7271 (0-based indices)
# Line 7271 (1-based) = index 7270 (0-based)
# Line 7272 (1-based) = index 7271 (0-based)

lines_to_delete = [7270, 7271]  # 0-based indices for lines 7271 and 7272

print("Deleting:")
for idx in sorted(lines_to_delete, reverse=True):
    print(f"  Line {idx+1}: {lines[idx].strip()[:100]}")
    lines.pop(idx)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"\nNew file: {len(lines)} lines")
print("✓ Done")
