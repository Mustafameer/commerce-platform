with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Find line number where 'Image saved: ' appears
idx = content.find('Image saved:')
if idx != -1:
    line_num = content[:idx].count('\n') + 1
    print(f'Image saved: appears at line {line_num}')
    print('Context:')
    lines = content.split('\n')
    for i in range(max(0, line_num-4), min(len(lines), line_num+6)):
        print(f'{i+1:4d}: {lines[i][:100]}')
else:
    print('Image saved: not found')
    
# Also look for uploadedUrls.push(imageUrl)
idx2 = content.find('uploadedUrls.push(imageUrl)')
if idx2 != -1:
    line_num2 = content[:idx2].count('\n') + 1
    print(f'\nuploadedUrls.push(imageUrl) appears at line {line_num2}')
else:
    print('\nuploadedUrls.push(imageUrl) not found')
