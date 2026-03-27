const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

// Find all instances of uploadedUrls
const regex = /uploadedUrls\.[^\n]*\)/g;
let match;
let count = 0;

console.log('All uploadedUrls references:');
while ((match = regex.exec(content)) !== null) {
  count++;
  const lineNum = content.substring(0, match.index).split('\n').length;
  console.log(count + ':', lineNum.toString().padStart(5), ':', match[0].substring(0, 80));
}

console.log('\nTotal found:', count);

// Now specifically look for the bad one
if (content.includes('uploadedUrls.push(imageUrl)')) {
  console.log('\n⚠️ FOUND THE BAD LINE: uploadedUrls.push(imageUrl)');
  console.log('This variable does not exist and must be removed');
} else {
  console.log('\n✓ Good news: uploadedUrls.push(imageUrl) not found');
}
