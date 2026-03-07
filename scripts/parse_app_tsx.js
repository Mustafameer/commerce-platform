const fs = require('fs');
const ts = require('typescript');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');

const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diags = sf.parseDiagnostics;

console.log('parseDiagnostics:', diags.length);
for (const d of diags.slice(0, 50)) {
  const pos = sf.getLineAndCharacterOfPosition(d.start ?? 0);
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`${file}:${pos.line + 1}:${pos.character + 1}: TS${d.code} ${msg}`);
}
