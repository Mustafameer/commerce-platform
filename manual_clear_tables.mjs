import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function getTableCounts() {
  const client = await pool.connect();
  
  try {
    const tables = [
      'app_settings',
      'auction_bids',
      'auctions',
      'cart_items',
      'categories',
      'company_users',
      'customer_payments',
      'customer_transactions',
      'customers',
      'merchant_applications',
      'order_images',
      'order_items',
      'orders',
      'product_images',
      'products',
      'promotional_images',
      'store_product_images',
      'stores',
      'topup_companies',
      'topup_orders',
      'topup_orders_detail',
      'topup_product_categories',
      'topup_product_images',
      'topup_products',
      'users'
    ];

    console.log('\n📊 عدد السجلات في كل جدول:\n');
    console.log('─'.repeat(50));
    
    const tableCounts = {};
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        tableCounts[table] = count;
        const status = count > 0 ? '❌' : '✅';
        console.log(`${status} ${table.padEnd(30)} : ${count.toString().padStart(6)} سجل`);
      } catch (e) {
        console.log(`⚠️  ${table.padEnd(30)} : خطأ`);
      }
    }
    
    console.log('─'.repeat(50));
    const totalCount = Object.values(tableCounts).reduce((a, b) => a + b, 0);
    console.log(`📊 إجمالي السجلات: ${totalCount}\n`);

    return tableCounts;
  } finally {
    await client.release();
  }
}

async function clearTable(tableName) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const countBefore = parseInt(result.rows[0].count);
    
    if (countBefore === 0) {
      console.log(`  ℹ️  ${tableName} فارغ بالفعل`);
      return 0;
    }

    try {
      await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    } catch (e) {
      await client.query(`DELETE FROM ${tableName}`);
    }

    console.log(`  ✅ تم حذف ${countBefore} سجل من ${tableName}`);
    return countBefore;
  } finally {
    await client.release();
  }
}

async function main() {
  console.log('\n🗑️  أداة تفريغ جداول قاعدة البيانات يدويا\n');

  const tableCounts = await getTableCounts();

  console.log('الخيارات:');
  console.log('1. حذف جدول معين');
  console.log('2. حذف عدة جداول');
  console.log('3. خروج\n');

  const choice = await question('اختر خيار (1/2/3): ');

  if (choice === '1') {
    // List tables with data
    const tablesWithData = Object.entries(tableCounts)
      .filter(([_, count]) => count > 0)
      .map(([name]) => name);

    if (tablesWithData.length === 0) {
      console.log('\n✅ جميع الجداول فارغة بالفعل!');
      rl.close();
      await pool.end();
      return;
    }

    console.log('\nالجداول التي تحتوي على بيانات:');
    tablesWithData.forEach((table, i) => {
      console.log(`${i + 1}. ${table} (${tableCounts[table]} سجل)`);
    });

    const tableIndex = await question('\nاختر رقم الجدول: ');
    const table = tablesWithData[parseInt(tableIndex) - 1];

    if (table) {
      const confirm = await question(`هل أنت متأكد من حذف ${tableCounts[table]} سجل من ${table}؟ (نعم/لا): `);
      if (confirm.toLowerCase() === 'نعم' || confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
        await clearTable(table);
      }
    }

  } else if (choice === '2') {
    const tablesWithData = Object.entries(tableCounts)
      .filter(([_, count]) => count > 0)
      .map(([name]) => name);

    if (tablesWithData.length === 0) {
      console.log('\n✅ جميع الجداول فارغة بالفعل!');
      rl.close();
      await pool.end();
      return;
    }

    console.log('\nالجداول التي تحتوي على بيانات:');
    tablesWithData.forEach((table, i) => {
      console.log(`${i + 1}. ${table} (${tableCounts[table]} سجل)`);
    });

    console.log('\nأدخل أرقام الجداول المراد حذفها مفصولة بفواصل (مثال: 1,3,5)');
    const input = await question('الأرقام: ');
    const indices = input.split(',').map(x => parseInt(x.trim()) - 1).filter(i => i >= 0 && i < tablesWithData.length);

    if (indices.length === 0) {
      console.log('لا توجد جداول محددة صحيحة');
      rl.close();
      await pool.end();
      return;
    }

    const selectedTables = indices.map(i => tablesWithData[i]);
    const totalRecords = selectedTables.reduce((sum, table) => sum + tableCounts[table], 0);

    console.log(`\n⚠️  ستقوم بحذف ${totalRecords} سجل من ${selectedTables.length} جدول`);
    const confirm = await question('هل أنت متأكد؟ (نعم/لا): ');

    if (confirm.toLowerCase() === 'نعم' || confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      console.log('\n🗑️  جاري الحذف...\n');
      let totalDeleted = 0;
      for (const table of selectedTables) {
        totalDeleted += await clearTable(table);
      }
      console.log(`\n✅ تم حذف ${totalDeleted} سجل بنجاح!`);
    }
  }

  rl.close();
  await pool.end();
}

main();
