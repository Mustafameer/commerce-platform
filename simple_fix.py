#!/usr/bin/env python3
# Read the problematic lines and replace them

with open('server.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
skip = False
skip_count = 0

for i, line in enumerate(lines):
    # Skip the DELETE statement block
    if 'DELETE FROM topup_product_images' in line:
        skip = True
        skip_count = 0
    
    if skip:
        skip_count += 1
        if skip_count > 10:  # Skip about 10 lines
            skip = False
        continue
    
    # Skip UPDATE topup_products
    if 'UPDATE topup_products SET images' in line:
        skip = True
        skip_count = 0
        continue
    
    # Skip remainingImages assignments
    if 'remainingImages' in line and ('filter' in line or 'slice' in line):
        output.append('    // remainingImages - not used\n')
        continue
    
    output.append(line)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.writelines(output)

print('Fixed!')
