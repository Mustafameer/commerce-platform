import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function dropColumns() {
  try {
    console.log('🧹 حذف الأعمدة القديمة من جدول auctions\n');

    // Drop the old columns
    await pool.query(`
      ALTER TABLE auctions
      DROP COLUMN IF EXISTS start_time,
      DROP COLUMN IF EXISTS end_time;
    `);

    console.log('✅ تم حذف العمودين بنجاح!\n');

    // Verify the schema
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'auctions'
      ORDER BY ordinal_position
    `);

    console.log('📋 الأعمدة المتبقية في جدول auctions:\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name}: ${row.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

dropColumns();
