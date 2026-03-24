import fs from 'fs';

const content = fs.readFileSync('./server.ts', 'utf-8');

// Find the section around line 1303
const lines = content.split('\n');
console.log('Lines 1303-1310 from server.ts:');
for (let i = 1302; i <= 1309; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Look for "category as description"
const hasCorrectQuery = content.includes('category as description');
console.log('\nFile contains "category as description":', hasCorrectQuery);

// Look for standalone "description" in SELECT
const hasStandaloneDescription = content.match(/SELECT.*description(?! as)/);
console.log('File contains SELECT ... description (without alias):', !!hasStandaloneDescription);

// Find all occurrences of "stores" queries
const storesQueries = content.match(/SELECT.*FROM stores[^;]*/g) || [];
console.log('\nAll SELECT ... FROM stores queries found:');
storesQueries.slice(0, 5).forEach((q, i) => {
  console.log(`\n${i + 1}: ${q.substring(0, 150)}...`);
});
