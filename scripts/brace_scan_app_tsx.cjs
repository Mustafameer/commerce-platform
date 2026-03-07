const fs = require('fs');
const ts = require('typescript');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');

const errors = [];
const scanner = ts.createScanner(
  ts.ScriptTarget.Latest,
  /* skipTrivia */ true,
  ts.LanguageVariant.JSX,
  text,
  (message, length) => {
    errors.push({ message, length, pos: scanner.getTextPos() });
  }
);

const openBraces = [];

let token = scanner.scan();
while (token !== ts.SyntaxKind.EndOfFileToken) {
  if (token === ts.SyntaxKind.OpenBraceToken) {
    openBraces.push(scanner.getTokenPos());
  } else if (token === ts.SyntaxKind.CloseBraceToken) {
    openBraces.pop();
  }
  token = scanner.scan();
}

console.log('unclosedOpenBraces:', openBraces.length);

if (errors.length) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  console.log('scannerErrors:', errors.length);
  for (const e of errors.slice(0, 10)) {
    const pos = sf.getLineAndCharacterOfPosition(e.pos);
    const msg = typeof e.message === 'string' ? e.message : (e.message && e.message.message) ? e.message.message : String(e.message);
    const code = e.message && e.message.code ? `TS${e.message.code}` : '';
    console.log(`${file}:${pos.line + 1}:${pos.character + 1}: ${code} ${msg}`.trim());
  }
}

if (openBraces.length) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const last = openBraces[openBraces.length - 1];
  const pos = sf.getLineAndCharacterOfPosition(last);
  console.log('lastUnclosedOpenBraceAt:', `${file}:${pos.line + 1}:${pos.character + 1}`);

  // print a small snippet around the location
  const start = Math.max(0, last - 120);
  const end = Math.min(text.length, last + 120);
  const snippet = text.slice(start, end).replace(/\r/g, '');
  console.log('snippet:\n' + snippet);
}
