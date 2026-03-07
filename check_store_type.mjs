import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce",
});

async function checkStore() {
  try {
    const res = await pool.query(
      `SELECT * FROM stores WHERE id = 13`
    );
    console.log("Store 13:", JSON.stringify(res.rows[0], null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkStore();
