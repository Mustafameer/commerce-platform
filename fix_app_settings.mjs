import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce',
  ssl: false
});

async function fixAppSettings() {
  try {
    await pool.query(`ALTER TABLE app_settings ADD COLUMN app_name VARCHAR(255)`).catch(() => {});
    await pool.query(`ALTER TABLE app_settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
    console.log('Done');
    pool.end();
  } catch (e) {
    pool.end();
  }
}

fixAppSettings();
