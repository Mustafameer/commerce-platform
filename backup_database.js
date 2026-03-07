const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  const client = new Client({
    user: 'postgres',
    password: '123',
    host: 'localhost',
    port: 5432,
    database: 'multi_ecommerce',
  });

  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // جلب كل الجداول
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public'
    `);

    let sqlContent = '-- Commerce Platform Database Backup\n';
    sqlContent += '-- Generated: ' + new Date().toISOString() + '\n\n';

    // تفريغ كل جدول
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`📦 جاري تفريغ جدول: ${tableName}`);

      // جلب schema
      const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name='${tableName}'
      `);

      // جلب البيانات
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

      // توليد SQL
      sqlContent += `\n-- Table: ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sqlContent += `CREATE TABLE "${tableName}" (\n`;
      
      schemaResult.rows.forEach((col, idx) => {
        sqlContent += `  "${col.column_name}" ${col.data_type}`;
        if (col.is_nullable === 'NO') sqlContent += ' NOT NULL';
        if (idx < schemaResult.rows.length - 1) sqlContent += ',';
        sqlContent += '\n';
      });
      sqlContent += `);\n\n`;

      // إدراج البيانات
      if (dataResult.rows.length > 0) {
        dataResult.rows.forEach(row => {
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return v;
          });
          sqlContent += `INSERT INTO "${tableName}" VALUES (${values.join(', ')});\n`;
        });
      }
    }

    // حفظ الملف
    const backupPath = path.join(__dirname, 'database_backup.sql');
    fs.writeFileSync(backupPath, sqlContent);
    console.log(`\n✅ تم حفظ الـ backup في: ${backupPath}`);
    console.log(`📊 حجم الملف: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);

  } catch (err) {
    console.error('❌ خطأ:', err.message);
  } finally {
    await client.end();
  }
}

backupDatabase();
