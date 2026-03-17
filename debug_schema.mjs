import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));
    
    const stores = await pool.query("SELECT id, store_name, store_type FROM stores");
    console.log('Stores Data:', stores.rows);
    
    for (let table of tables.rows) {
      if (['stores', 'topup_products', 'products', 'topup_companies'].includes(table.table_name)) {
        const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table.table_name}'`);
        console.log(`Columns in ${table.table_name}:`, cols.rows.map(c => c.column_name));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkSchema();