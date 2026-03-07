const fs = require('fs');

const file = 'src/App.tsx';
const text = fs.readFileSync(file, 'utf8');
const backticks = (text.match(/`/g) || []).length;
console.log({ file, backticks, odd: backticks % 2 === 1 });
