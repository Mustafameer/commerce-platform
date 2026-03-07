import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

async function checkAdmins() {
  try {
    const result = await pool.query("SELECT id, name, phone, email, role FROM users WHERE role = 'admin' ORDER BY id");
    console.log("Admin Users:", result.rows);
    
    const allUsers = await pool.query("SELECT id, name, phone, email, role FROM users ORDER BY id");
    console.log("\nAll Users:", allUsers.rows);
    
    await pool.end();
  } catch (error) {
    console.error("Error:", (error as any).message);
    await pool.end();
  }
}

checkAdmins();
