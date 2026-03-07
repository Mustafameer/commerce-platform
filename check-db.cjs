const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDb() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Found tables:", res.rows.map(r => r.table_name));
    
    for (let table of res.rows) {
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      console.log(`Table ${table.table_name}: ${countRes.rows[0].count} rows`);
      
      if (table.table_name === 'users') {
          const usersRes = await pool.query("SELECT email, role FROM users LIMIT 5");
          console.log("Sample users:", usersRes.rows);
      }
    }
    await pool.end();
  } catch (err) {
    console.error("DB check failed:", err);
  }
}

checkDb();
