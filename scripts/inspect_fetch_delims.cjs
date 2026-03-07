const fs = require('fs');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);

const targetLines = [3384, 3388, 3406, 3416, 3421, 3425];

function hex(n) {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0');
}

for (const ln of targetLines) {
  const s = lines[ln - 1] || '';
  const idx = s.indexOf('fetch(');
  if (idx === -1) {
    console.log(`${ln}: no fetch(`);
    continue;
  }
  const ch = s[idx + 'fetch('.length];
  const cu = s.charCodeAt(idx + 'fetch('.length);
  console.log(`${ln}: after fetch( => ${JSON.stringify(ch)} codeUnit=${hex(cu)}`);
  console.log('  line:', s.trim().slice(0, 160));
}
