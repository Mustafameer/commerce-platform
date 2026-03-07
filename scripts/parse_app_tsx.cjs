const fs = require('fs');
const ts = require('typescript');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');

const sourceFile = ts.createSourceFile(
  file,
  text,
  ts.ScriptTarget.Latest,
  /* setParentNodes */ true,
  ts.ScriptKind.TSX
);

const diagnostics = sourceFile.parseDiagnostics;
console.log('parseDiagnostics:', diagnostics.length);

if (diagnostics.length > 0) {
  const d0 = diagnostics[0];
  const msg0 = ts.flattenDiagnosticMessageText(d0.messageText, '\n');
  console.log('firstDiagnostic:', { code: d0.code, start: d0.start, length: d0.length, message: msg0 });
}

for (const d of diagnostics.slice(0, 50)) {
  const start = typeof d.start === 'number' ? d.start : 0;
  const pos = sourceFile.getLineAndCharacterOfPosition(start);
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`${file}:${pos.line + 1}:${pos.character + 1}: TS${d.code} ${msg}`);
}
