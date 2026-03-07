const fs = require('fs');
const ts = require('typescript');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');

const marker = '\n};\n\nconst CustomerStorefront';
const markerIndex = text.indexOf(marker);
console.log('markerIndex', markerIndex);
if (markerIndex === -1) {
  console.error('Marker not found');
  process.exit(1);
}

const scannerErrors = [];
const scanner = ts.createScanner(
  ts.ScriptTarget.Latest,
  /* skipTrivia */ false,
  ts.LanguageVariant.Standard,
  text,
  (message, length) => {
    scannerErrors.push({ message, length, pos: scanner.getTextPos() });
  }
);

function fmtToken(tk) {
  return ts.SyntaxKind[tk];
}

// Scan and keep a rolling window of tokens until we pass markerIndex
const windowSize = 80;
const ring = [];

let token = scanner.scan();
while (token !== ts.SyntaxKind.EndOfFileToken) {
  const tokenPos = scanner.getTokenPos();
  const textPos = scanner.getTextPos();
  if (textPos >= markerIndex && textPos <= markerIndex + marker.length + 20) {
    // keep tokens around marker region
  }

  ring.push({ token, tokenPos, textPos, tokenText: scanner.getTokenText() });
  if (ring.length > windowSize) ring.shift();

  if (textPos >= markerIndex + marker.length + 5) break;
  token = scanner.scan();
}

console.log('scannerErrors', scannerErrors.length);
if (scannerErrors.length) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const e of scannerErrors.slice(0, 10)) {
    const pos = sf.getLineAndCharacterOfPosition(e.pos);
    const msg = typeof e.message === 'string' ? e.message : (e.message && e.message.message) ? e.message.message : String(e.message);
    const code = e.message && e.message.code ? `TS${e.message.code}` : '';
    console.log(`${file}:${pos.line + 1}:${pos.character + 1}: ${code} ${msg}`.trim());
  }
}

console.log('--- tokens before/around marker ---');
for (const r of ring) {
  const snippet = r.tokenText.replace(/\s+/g, ' ');
  console.log(`${r.tokenPos}-${r.textPos} ${fmtToken(r.token)} ${JSON.stringify(snippet).slice(0, 120)}`);
}

// Print details for any template tokens in the window
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const templateLike = ring.filter(r => fmtToken(r.token).includes('Template'));
if (templateLike.length) {
  console.log('--- template tokens (line/col) ---');
  for (const r of templateLike.slice(0, 20)) {
    const lc = sf.getLineAndCharacterOfPosition(r.tokenPos);
    const raw = text.slice(r.tokenPos, Math.min(text.length, r.tokenPos + 120)).replace(/\r/g, '').replace(/\n/g, '\\n');
    console.log(`${lc.line + 1}:${lc.character + 1} ${fmtToken(r.token)} raw=${JSON.stringify(raw).slice(0, 160)}`);
  }
}
