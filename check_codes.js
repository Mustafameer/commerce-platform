const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:mustafa2002@localhost:5432/commerce'
});

async function checkCodes() {
  try {
    const result = await pool.query(
      SELECT id, name, codes, codes::TEXT as codes_text FROM topup_products LIMIT 3
    );
    console.log('Topup Products:');
    result.rows.forEach(row => {
      console.log(ID: \, Name: \);
      console.log(  Codes Type: \);
      console.log(  Codes Value: \);
      console.log(  Codes Text: \);
      if (Array.isArray(row.codes)) {
        console.log(  Array Length: \);
        console.log(  First 3: \);
      }
      console.log('---');
    });
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkCodes();