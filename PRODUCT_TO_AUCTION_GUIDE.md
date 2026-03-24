# تحويل المنتج إلى مزاد في المتاجر العادية

## نظرة عامة

هذا الملف (`convert_product_to_auction.mjs`) يوفر حلاً شاملاً لتحويل منتج عادي من متجر عادي (regular store) إلى منتج مزاد، مع ضمان:

✅ **السعر ينتقل تلقائياً** - حقل `price` من المنتج ينقل إلى `starting_price` في المزاد  
✅ **حفظ التاريخ والأوقات** - يتم حفظ `auction_date`, `auction_start_time`, `auction_end_time` بشكل صحيح  
✅ **تطابق الأعمدة** - جميع الأعمدة تطابق الجداول الفعلية في قاعدة البيانات  
✅ **المتاجر العادية حصراً** - فقط متاجر من نوع `regular` يمكن تحويلها (ليس `topup`)  

---

## البنية الدنيا

### جدول `auctions`

الأعمدة الرئيسية المستخدمة:

| العمود | النوع | الوصف |
|-------|------|--------|
| `id` | SERIAL | معرّف المزاد (مفتاح أساسي) |
| `product_id` | INTEGER | معرّف المنتج (مفتاح خارجي) |
| `store_id` | INTEGER | معرّف المتجر |
| `auction_date` | DATE | تاريخ المزاد (بصيغة YYYY-MM-DD) |
| `auction_start_time` | TIME | وقت بداية المزاد (بصيغة HH:MM) |
| `auction_end_time` | TIME | وقت نهاية المزاد (بصيغة HH:MM) |
| `starting_price` | DECIMAL(10,2) | سعر البداية (ينُقل من product.price) |
| `current_highest_price` | DECIMAL(10,2) | أعلى سعر حالي (يبدأ بـ starting_price) |
| `status` | VARCHAR | حالة المزاد (pending, active, completed, cancelled) |
| `created_at` | TIMESTAMP | وقت إنشاء السجل |

### جدول `products`

الأعمدة المُحدّثة عند التحويل:

| العمود | القيمة | الوصف |
|-------|--------|--------|
| `is_auction` | true | علامة تشير لأن المنتج مزاد |
| `auction_id` | auction.id | معرّف المزاد المرتبط |
| `price` | ← استخدم | سعر المنتج ينتقل إلى starting_price |

### جدول `stores`

التحقق من النوع:

| الشرط | القيمة المتوقعة |
|-------|-----------------|
| `store_type` | 'regular' (ليس 'topup') |

---

## خطوات التحويل

### Step 1: التحقق من وجود المنتج
- جلب بيانات المنتج (`id`, `store_id`, `name`, `price`)
- التأكد من عدم وجود خطأ في المعرّف

### Step 2: التحقق من نوع المتجر
- التأكد من أن `store_type = 'regular'`
- رفض متاجر التوبأب

### Step 3: تحقق من صيغة التاريخ والأوقات
- التاريخ: `YYYY-MM-DD` (مثال: 2026-03-22)
- الوقت: `HH:MM` بصيغة 24 ساعة (مثال: 10:00, 23:59)
- التحقق من أن `end_time > start_time`

### Step 4: التحقق من حالة المنتج
- تحذير إذا كان المنتج مزاداً بالفعل
- السماح باستبدال المزاد القديم

### Step 5: إنشاء سجل المزاد
```sql
INSERT INTO auctions (
  product_id, store_id,
  auction_date, auction_start_time, auction_end_time,
  starting_price, current_highest_price,
  status, created_at
) VALUES (...)
```

**النقاط المهمة:**
- `starting_price` = `product.price` (السعر ينتقل تلقائياً)
- `current_highest_price` = `starting_price` (تبدأ من نفس السعر)
- `status` = `'pending'` (حالة افتراضية عند الإنشاء)

### Step 6: تحديث المنتج
```sql
UPDATE products
SET is_auction = true, auction_id = $1
WHERE id = $2
```

---

## الاستخدام

### الطريقة الأساسية

```bash
node convert_product_to_auction.mjs <product_id> <date> <start_time> <end_time>
```

### أمثلة

**مثال 1: تحويل بسيط**
```bash
node convert_product_to_auction.mjs 34 2026-03-22 10:00 18:00
```

**مثال 2: مزاد في الصباح الباكر**
```bash
node convert_product_to_auction.mjs 45 2026-03-25 06:00 14:00
```

**مثال 3: مزاد طويل (24 ساعة عملياً)**
```bash
node convert_product_to_auction.mjs 50 2026-03-30 09:00 21:00
```

### المعاملات

| المعامل | الصيغة | مثال | ملاحظة |
|--------|--------|-------|--------|
| product_id | عدد صحيح | 34 | معرّف يجب أن يكون موجوداً |
| date | YYYY-MM-DD | 2026-03-22 | يجب أن تكون صيغة صحيحة |
| start_time | HH:MM | 10:00 | 24-ساعة، بدون ثوانٍ |
| end_time | HH:MM | 18:00 | يجب أن تكون أكبر من start_time |

---

## المخرجات

### نجاح التحويل

```
════════════════════════════════════════════════════════════
✅ تم التحويل بنجاح!
════════════════════════════════════════════════════════════

📋 ملخص المزاد:

  المنتج: منتج تجريبي للمزاد (#34)
  المتجر: #5 (regular)
  معرّف المزاد: 15
  سعر البداية: 50000.00 ريال
  التاريخ: 2026-03-22
  من الساعة: 10:00
  إلى الساعة: 18:00
  الحالة: pending
```

### رسائل الخطأ

**المنتج غير موجود:**
```
❌ خطأ: ❌ المنتج #999 غير موجود
```

**متجر توبأب:**
```
❌ خطأ: ❌ لا يمكن تحويل منتج من متجر توبأب إلى مزاد. المتاجر العادية حصراً!
```

**صيغة التاريخ خاطئة:**
```
❌ خطأ: ❌ صيغة التاريخ غير صحيحة. المتوقع: YYYY-MM-DD (مثال: 2026-03-22)
```

**الوقت النهائي أقل من الابتدائي:**
```
❌ خطأ: ❌ وقت النهاية يجب أن يكون بعد وقت البداية!
البداية: 18:00
النهاية: 10:00
```

---

## التحقق من النتيجة

### 1. التحقق من قاعدة البيانات مباشرة

```bash
# فحص سجل المزاد
SELECT id, product_id, auction_date, auction_start_time, auction_end_time, starting_price, status
FROM auctions WHERE id = 15;

# فحص بيانات المنتج
SELECT id, name, price, is_auction, auction_id
FROM products WHERE id = 34;
```

### 2. استخدام الملف الموفر

```bash
node verify_saved_data.mjs
```

**النتيجة المتوقعة:**
```
✅ Auction record saved in database:
  ID: 15
  Product ID: 34
  Store ID: 5
  Status: pending

💰 Price Fields:
  starting_price: 50000.00 ✓
  current_highest_price: 50000.00 ✓

📅 Date & Time Fields:
  auction_date: 2026-03-22 ✓
  auction_start_time: 10:00:00 ✓
  auction_end_time: 18:00:00 ✓

✅ All required fields are properly saved and match!
```

---

## حالات الاختبار

### 1. ✅ تحويل ناجح

```bash
node convert_product_to_auction.mjs 34 2026-03-22 10:00 18:00
# النتيجة: ✅ تم التحويل بنجاح
```

**التحقق:**
- `is_auction` = true ✓
- `auction_id` = 15 ✓
- `starting_price` = 50000 (من product.price) ✓

### 2. ❌ منتج غير موجود

```bash
node convert_product_to_auction.mjs 9999 2026-03-22 10:00 18:00
# النتيجة: ❌ خطأ: ❌ المنتج #9999 غير موجود
```

### 3. ❌ متجر توبأب

إنشاء منتج في متجر توبأب ثم محاولة التحويل:
```bash
# سيفشل برسالة: لا يمكن تحويل منتج من متجر توبأب
```

### 4. ❌ صيغة تاريخ خاطئة

```bash
node convert_product_to_auction.mjs 34 22-03-2026 10:00 18:00
# النتيجة: ❌ خطأ: صيغة التاريخ غير صحيحة
```

### 5. ❌ وقت نهاية أقل من البداية

```bash
node convert_product_to_auction.mjs 34 2026-03-22 18:00 10:00
# النتيجة: ❌ خطأ: وقت النهاية يجب أن يكون بعد وقت البداية
```

---

## ملاحظات مهمة

### ⚠️ الأعمدة المستخدمة

تم استخدام الأعمدة الفعلية الموجودة في قاعدة البيانات:

- ✅ `auction_date` (DATE)
- ✅ `auction_start_time` (TIME)
- ✅ `auction_end_time` (TIME)
- ✅ `starting_price` (DECIMAL)
- ✅ `current_highest_price` (DECIMAL)

**لم يتم استخدام:**
- ❌ `start_time` / `end_time` (قديمة)
- ❌ `current_price` (تم استبدالها بـ `current_highest_price`)

### 🔄 السعر التلقائي

سعر البداية **ينقل تلقائياً** من `product.price`:

```javascript
starting_price: product.price,         // السعر يُنقل من product.price
current_highest_price: product.price,  // يبدأ من نفس السعر
```

لذلك لا حاجة لإدخال السعر يدويًا - البيانات موجودة بالفعل!

### 🏪 المتاجر العادية حصراً

التحويل متاح فقط للمتاجر حيث:
```javascript
store_type === 'regular'
```

متاجر التوبأب سيتم رفضها مع رسالة خطأ واضحة.

### 📅 الحفظ الموثوق

البيانات تُحفظ مباشرة كما هي:
- **التاريخ**: `auction_date` (من "2026-03-22")
- **البداية**: `auction_start_time` (من "10:00")
- **النهاية**: `auction_end_time` (من "18:00")

---

## ملفات مرتبطة

| الملف | الوصف | الاستخدام |
|------|--------|------------|
| `convert_product_to_auction.mjs` | **الملف الرئيسي** - يحول المنتج للمزاد | `node convert_product_to_auction.mjs <product_id> <date> <start_time> <end_time>` |
| `create_test_product.mjs` | ينشئ منتج تجريبي في store 5 | `node create_test_product.mjs` |
| `verify_saved_data.mjs` | يتحقق من البيانات المحفوظة | `node verify_saved_data.mjs` |
| `verify_columns.mjs` | يعرض جميع أعمدة الجداول | `node verify_columns.mjs` |

---

## خطوات الإعداد السريع

### إنشاء منتج تجريبي

```bash
node create_test_product.mjs
# سيعطيك: Product ID: 34
```

### التحويل للمزاد

```bash
node convert_product_to_auction.mjs 34 2026-03-22 10:00 18:00
```

### التحقق

```bash
node verify_saved_data.mjs
```

---

## الخلاصة

✅ **كود مراجع وصحيحة تماماً**  
✅ **جميع الأعمدة تطابق قاعدة البيانات الفعلية**  
✅ **السعر ينقل تلقائياً من المنتج**  
✅ **التاريخ والأوقات تُحفظ بشكل صحيح**  
✅ **تم اختبار الكود بنجاح**  
✅ **رسائل خطأ واضحة وقابلة للفهم**  
✅ **تحقق من المتاجر العادية حصراً**  

الملف جاهز للاستخدام في الإنتاج! 🚀
