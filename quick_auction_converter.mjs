#!/usr/bin/env node
/**
 * نموذج سريع لاستخدام دالة تحويل المنتج للمزاد
 * 
 * الاستخدام:
 *   node quick_auction_converter.mjs [product_id] [date] [start_time] [end_time]
 * 
 * أمثلة:
 *   node quick_auction_converter.mjs 34 2026-03-22 10:00 18:00
 *   node quick_auction_converter.mjs 45 2026-03-25 06:00 14:00
 */

import convertModule from './convert_product_to_auction.mjs';

// يتم تمرير المعاملات من command line
// أو استخدام القيم الافتراضية للاختبار

const productId = parseInt(process.argv[2]) || 34;
const auctionDate = process.argv[3] || '2026-03-22';
const startTime = process.argv[4] || '10:00';
const endTime = process.argv[5] || '18:00';

console.log(`\n${'═'.repeat(70)}`);
console.log('🎯 تحويل منتج إلى مزاد - المتاجر العادية');
console.log(`${'═'.repeat(70)}\n`);

console.log('📋 المعاملات:');
console.log(`  • معرّف المنتج: ${productId}`);
console.log(`  • التاريخ: ${auctionDate}`);
console.log(`  • من الساعة: ${startTime}`);
console.log(`  • إلى الساعة: ${endTime}\n`);

console.log('💡 نصائح الاستخدام:');
console.log('  • التاريخ: YYYY-MM-DD (مثال: 2026-03-22)');
console.log('  • الأوقات: HH:MM بصيغة 24 ساعة (مثال: 10:00, 23:59)');
console.log('  • السعر ينقل تلقائياً من product.price');
console.log('  • المتاجر العادية فقط (ليس توبأب)\n');
