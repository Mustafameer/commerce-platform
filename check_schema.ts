import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log("Users table columns:", result.rows);
    
    // Check if can_access_admin exists
    const hasAdminAccess = result.rows.find(r => r.column_name === 'can_access_admin');
    console.log("\nhas can_access_admin column:", !!hasAdminAccess);
    
    await pool.end();
  } catch (error) {
    console.error("Error:", (error as any).message);
    await pool.end();
  }
}

checkSchema();
