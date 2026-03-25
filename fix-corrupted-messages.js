const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// Define fixes - replace corrupted Arabic with clean UTF-8
const fixes = [
  // Fix error messages with corrupted encoding
  ['â‌Œ ط§ظ„ط¹ظ…ظٹظ„ ط؛ظٹط± ظ…ط³ط¬ظ„', 'العميل غير مسجل'],
  ['â‌Œ ط®ط·ط£ ظپظٹ ط§ظ„ط¨ظٹط§ظ†ط§طھ', 'خطأ في البيانات'],
  ['â‌Œ ط®ط·ط£', 'خطأ'],
  ['â‌Œ ظپط´ظ„ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¹ظ…ظٹظ„', 'فشل التحقق من العميل'],
  ['ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯ - ', 'عميل جديد - '],
  ['â‌Œ ط®ط·ط£ ظپظٹ ط§ظ„ط¨ظٹط§ظ†ط§طھ', 'خطأ في البيانات'],
  ['â‌Œ ظ…ط¹ط±ظپ ط§ظ„ط¹ظ…ظٹظ„ ط؛ظٹط± طµط­ظٹط­', 'معرف العميل غير صحيح'],
  ['â‌Œ ظ…ط¹ط±ظپ ط§ظ„ظ…طھط¬ط± ط؛ظٹط± طµط­ظٹط­', 'معرف المتجر غير صحيح'],
  ['â‌Œ ط§ظ„ط±طµظٹط¯ ط§ظ„ظ…طھط§ط­ ', 'الرصيد المتاح '],
  ['ط£ظ‚ظ„ ظ…ظ† ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط·ظ„ظˆط¨', 'أقل من المبلغ المطلوب'],
];

let count = 0;
for (const [corrupted, clean] of fixes) {
  if (content.includes(corrupted)) {
    console.log(`Fixing: "${corrupted}" → "${clean}"`);
    content = content.replaceAll(corrupted, clean);
    count++;
  }
}

fs.writeFileSync('server.ts', content, 'utf-8');
console.log(`\n✅ Fixed ${count} corrupted text patterns`);
