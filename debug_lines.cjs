const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');
const lines = content.split(/\r?\n/);

// Find uploadedUrls.push(imageUrlCompressed) and print lines around it
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('uploadedUrls.push(imageUrlCompressed)')) {
    console.log('Found at line', i + 1);
    console.log('Printing lines ' + i + ' to ' + Math.min(i + 10, lines.length - 1) + ':');
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      console.log('[' + (j + 1) + '] ' + JSON.stringify(lines[j].substring(0, 80)));
    }
    break;
  }
}
