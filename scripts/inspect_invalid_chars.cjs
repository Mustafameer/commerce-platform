const fs = require('fs');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);

const positions = [
  { line: 1714, col: 24 },
];

function describeChar(str, index) {
  if (index < 0 || index >= str.length) return { note: 'out of range' };
  const codeUnit = str.charCodeAt(index);
  const codePoint = str.codePointAt(index);
  const ch = str[index];
  const cpHex = codePoint != null ? 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0') : 'n/a';
  const cuHex = '0x' + codeUnit.toString(16).toUpperCase().padStart(4, '0');
  const isSurrogate = codeUnit >= 0xD800 && codeUnit <= 0xDFFF;
  const printable = ch === '\t' ? '\\t' : ch === '\r' ? '\\r' : ch === '\n' ? '\\n' : ch;
  let next = undefined;
  if (isSurrogate && index + 1 < str.length) {
    const nextCodeUnit = str.charCodeAt(index + 1);
    next = {
      cuHex: '0x' + nextCodeUnit.toString(16).toUpperCase().padStart(4, '0'),
      isLowSurrogate: nextCodeUnit >= 0xDC00 && nextCodeUnit <= 0xDFFF,
      char: str[index + 1],
    };
  }
  return { printable, cuHex, cpHex, isSurrogate, next };
}

for (const p of positions) {
  const lineStr = lines[p.line - 1] ?? '';
  const idx = p.col - 1;
  const info = describeChar(lineStr, idx);
  const contextStart = Math.max(0, idx - 20);
  const contextEnd = Math.min(lineStr.length, idx + 20);
  const context = lineStr.slice(contextStart, contextEnd);
  console.log(`${file}:${p.line}:${p.col}`);
  console.log('  context:', JSON.stringify(context));
  console.log('  char:', info);
}
