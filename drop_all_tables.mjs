import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  جاري حذف جميع الجداول...\n');

    // Drop all tables (order matters due to foreign keys)
    const tablesToDrop = [
      'auction_bids',
      'auctions',
      'company_users',
      'app_settings',
      'merchant_applications',
      'topup_orders_detail',
      'topup_orders',
      'customer_transactions',
      'customer_payments',
      'topup_product_images',
      'cart_items',
      'order_items',
      'orders',
      'customers',
      'topup_products',
      'topup_product_categories',
      'topup_companies',
      'products',
      'categories',
      'stores',
      'users'
    ];

    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ حذف جدول ${table}`);
      } catch (e) {
        console.log(`⚠️  ${table}: ${e.message}`);
      }
    }

    console.log('\n✅ تم حذف جميع الجداول بنجاح!\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

dropAllTables();
