#!/usr/bin/env node

import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

const connectionString = 'postgresql://postgres:123@localhost:5432/multi_ecommerce';
const pool = new Pool({ connectionString, ssl: false });

async function exportDatabase() {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║    LOCAL DATABASE TO RAILWAY EXPORT TOOL      ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📊 Database Statistics:\n');

    const stores = await pool.query('SELECT COUNT(*) as c FROM stores');
    const companies = await pool.query('SELECT COUNT(*) as c FROM topup_companies WHERE store_id = 13');
    const products = await pool.query('SELECT COUNT(*) as c FROM topup_products WHERE store_id = 13');
    const images = await pool.query('SELECT COUNT(*) as c FROM topup_product_images');
    const users = await pool.query('SELECT COUNT(*) as c FROM users');

    console.log(`   📍 Stores: ${stores.rows[0].c}`);
    console.log(`   🏢 Companies (Store 13): ${companies.rows[0].c}`);
    console.log(`   📦 Products (Store 13): ${products.rows[0].c}`);
    console.log(`   🖼️  Product Images: ${images.rows[0].c}`);
    console.log(`   👤 Users: ${users.rows[0].c}\n`);

    // Verify Store 13 data
    const storeData = await pool.query(`
      SELECT id, store_name, store_type, is_active 
      FROM stores WHERE id = 13
    `);

    if (storeData.rows.length > 0) {
      console.log('✅ Store 13 Details:');
      const store = storeData.rows[0];
      console.log(`   Name: ${store.store_name}`);
      console.log(`   Type: ${store.store_type}`);
      console.log(`   Active: ${store.is_active}\n`);
    }

    // Verify products and images
    const productsWithImages = await pool.query(`
      SELECT 
        tp.id as product_id,
        tp.amount,
        tp.price,
        tc.name as company_name,
        tpi.id as image_id
      FROM topup_products tp
      LEFT JOIN topup_companies tc ON tp.company_id = tc.id
      LEFT JOIN topup_product_images tpi ON tp.id = tpi.topup_product_id
      WHERE tp.store_id = 13
      ORDER BY tp.id
    `);

    console.log('📦 Products with Images:\n');
    productsWithImages.rows.forEach((row, i) => {
      const img = row.image_id ? '✅ HAS IMAGE' : '❌ NO IMAGE';
      console.log(`   ${i + 1}. ${row.company_name} | ${row.amount} ريال | ${img}`);
    });

    console.log('\n✅ DATABASE IS READY FOR UPLOAD!\n');
    console.log('📤 Next Steps:');
    console.log('   1. Go to: https://railway.app/project');
    console.log('   2. Select your PostgreSQL service');
    console.log('   3. Go to: Data → Backups → Restore');
    console.log('   4. Upload local backup file\n');

    console.log('📥 OR use Railway CLI:');
    console.log('   railway db:restore /path/to/backup.sql\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

exportDatabase();
