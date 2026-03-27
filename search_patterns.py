#!/usr/bin/env python3

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Multiple search patterns
patterns = [
    'uploadedUrls.push(imageUrl)',
    'Image processed:',
    'imageUrl}',
    'imageUrl`'
]

found_anything = False
for pattern in patterns:
    if pattern in content:
        print(f'✓ Found: {pattern}')
        found_anything = True
    else:
        print(f'✗ Not found: {pattern}')

if not found_anything:
    print('\nNo problematic patterns found in the file')
else:
    # Try to find context
    if 'Image processed' in content:
        idx = content.find('Image processed')
        line_num = content[:idx].count('\n') + 1
        print(f'\nImage processed at line: {line_num}')
