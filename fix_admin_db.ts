import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce' });

async function fix() {
  try {
    // Check if the user exists
    const res = await pool.query("SELECT * FROM users WHERE id = 26 OR email = '07810909577'");
    if (res.rows.length > 0) {
      const u = res.rows[0];
      await pool.query("UPDATE users SET phone = $1, email = NULL WHERE id = $2", [u.email || u.phone, u.id]);
      console.log('✅ Updated user ' + u.id + ': Moved number into phone column.');
    } else {
      console.log('❌ User not found for fixing.');
    }
  } catch (err) {
    console.error('❌ Error fixing database:', err);
  } finally {
    await pool.end();
  }
}

fix();
