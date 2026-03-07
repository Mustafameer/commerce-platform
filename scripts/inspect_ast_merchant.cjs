const fs = require('fs');
const ts = require('typescript');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function lc(pos) {
  const p = sf.getLineAndCharacterOfPosition(pos);
  return `${p.line + 1}:${p.character + 1}`;
}

let merchantDecl = null;
for (const stmt of sf.statements) {
  if (!ts.isVariableStatement(stmt)) continue;
  for (const decl of stmt.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && decl.name.text === 'MerchantDashboard') {
      merchantDecl = decl;
    }
  }
}

console.log('parseDiagnostics', sf.parseDiagnostics.map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') })));

if (!merchantDecl) {
  console.log('MerchantDashboard decl not found in top-level statements');
  process.exit(0);
}

console.log('MerchantDashboard decl pos', lc(merchantDecl.pos), 'end', lc(merchantDecl.end));

const init = merchantDecl.initializer;
if (!init) {
  console.log('No initializer');
  process.exit(0);
}
console.log('initializer kind', ts.SyntaxKind[init.kind], 'pos', lc(init.pos), 'end', lc(init.end));

// Try to find the function body block if present
if (ts.isArrowFunction(init)) {
  const body = init.body;
  console.log('arrow body kind', ts.SyntaxKind[body.kind], 'pos', lc(body.pos), 'end', lc(body.end));
  if (ts.isBlock(body)) {
    const lastStmt = body.statements[body.statements.length - 1];
    console.log('block statements', body.statements.length);
    if (lastStmt) {
      console.log('last stmt kind', ts.SyntaxKind[lastStmt.kind], 'pos', lc(lastStmt.pos), 'end', lc(lastStmt.end));
      console.log('last stmt text (first 200 chars):', JSON.stringify(lastStmt.getText(sf).slice(0, 200)));
    }

    // Find where CustomerStorefront is being parsed
    const idx = body.statements.findIndex(s => {
      if (!ts.isVariableStatement(s)) return false;
      return s.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === 'CustomerStorefront');
    });
    console.log('CustomerStorefront statement index in MerchantDashboard block:', idx);
    if (idx !== -1) {
      const from = Math.max(0, idx - 2);
      const to = Math.min(body.statements.length, idx + 3);
      console.log('--- statements around CustomerStorefront (as parsed) ---');
      for (let i = from; i < to; i++) {
        const s = body.statements[i];
        console.log(`#${i} ${ts.SyntaxKind[s.kind]} ${lc(s.pos)}-${lc(s.end)} text=${JSON.stringify(s.getText(sf).slice(0, 160))}`);
      }
    }
  }
}

// Print last 5 top-level statements kinds/positions
console.log('--- last 5 top-level statements ---');
const stmts = sf.statements;
for (const stmt of stmts.slice(Math.max(0, stmts.length - 5))) {
  console.log(ts.SyntaxKind[stmt.kind], lc(stmt.pos), lc(stmt.end));
}
