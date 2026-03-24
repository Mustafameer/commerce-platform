# 🚀 نقل قاعدة البيانات إلى Railway

تم إنشاء نسخة احتياطية كاملة من قاعدة البيانات المحلية بنجاح! ✅

## 📊 معلومات الـ Backup

- **الملف**: `railway_backup_full.sql`
- **الحجم**: 13.17 MB
- **الجداول**: 26 جدول
- **الصفوف المنسوخة**: 
  - app_settings: 1
  - auction_bids: 2
  - auctions: 1
  - categories: 3
  - customers: 2
  - order_images: 45
  - products: 2
  - stores: 2
  - topup_companies: 2
  - topup_product_categories: 1
  - topup_product_images: 18
  - topup_products: 6
  - users: 3

---

## 🔗 بيانات الاتصال بـ Railway

```
Host: web-production-9efff.up.railway.app
Port: 5432
User: postgres
Password: yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ
Database: railway
```

---

## 📝 الطريقة 1️⃣: رفع عبر Railway Dashboard (الأسهل)

### الخطوات:

1. **افتح موقع Railway**
   - اذهب إلى: https://railway.app/dashboard

2. **اختر المشروع**
   - اضغط على: `commerce-platform`

3. **اختر خدمة PostgreSQL**
   - اضغط على: `PostgreSQL` (أو Database service)

4. **اذهب إلى قسم البيانات**
   - اضغط على التبويب: `Data` أو `Database`

5. **اختر Restore/Import**
   - ابحث عن: `Restore` أو `Import SQL`
   - اضغط على: `Upload File`

6. **اختر الملف**
   - الملف: `railway_backup_full.sql` 
   - الموجود في: `c:\Users\Hp\Desktop\commerce-platform\`

7. **ابدأ الاستيراد**
   - اضغط: `Restore` أو `Import`
   - انتظر 2-10 دقائق لانتهاء العملية

---

## 🖥️ الطريقة 2️⃣: رفع عبر Command Line (psql)

### المتطلبات:
- تثبيت PostgreSQL Client Tools على جهازك
- أو استخدام WSL (Windows Subsystem for Linux)

### الخطوات:

```bash
# 1. الذهاب إلى مجلد المشروع
cd c:\Users\Hp\Desktop\commerce-platform

# 2. تعيين الكلمة المرورية في المتغيرات
$env:PGPASSWORD="yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ"

# 3. تشغيل أمر الاستيراد
psql -h web-production-9efff.up.railway.app -U postgres -p 5432 -d railway -f railway_backup_full.sql

# انتظر حتى ينتهي الأمر (قد يستغرق 5-15 دقيقة)
```

---

## ⚡ الطريقة 3️⃣: استخدام أداة DBeaver أو SQL Client

1. **فتح DBeaver أو أي SQL Client**

2. **إنشاء اتصال جديد**
   - Host: `web-production-9efff.up.railway.app`
   - Port: `5432`
   - User: `postgres`
   - Password: `yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ`
   - Database: `railway`

3. **اختيار File > Execute Script**
   - اختر: `railway_backup_full.sql`

4. **تشغيل الـ Script**
   - انتظر حتى ينتهي

---

## ✅ التحقق من نجاح النقل

بعد انتهاء الاستيراد، تحقق من النتائج:

### 1️⃣ عبر Railway Dashboard:
- اذهب إلى: `PostgreSQL Database > Query`
- شغل الأمر:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

يجب أن تظهر 26 جدول ✅

### 2️⃣ عبر API:
- اختبر الاتصال:
```
https://web-production-9efff.up.railway.app/api/test-db
```

يجب أن يعيد JSON مثل:
```json
{
  "stores_count": 2,
  "products_count": 2,
  "users_count": 3,
  "status": "connected"
}
```

### 3️⃣ عبر أداة SQL:
```sql
-- تحقق من عدد الجداول
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- تحقق من عدد الصفوف في كل جدول
SELECT table_name, 
       (xpath('/row', query_to_xml(format('SELECT COUNT(*) FROM %I', table_name), false, true, '')))[1]::text::int as row_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- عرض الجداول الموجودة
\dt
```

---

## ⚠️ ملاحظات مهمة

1. **قبل الاستيراد**: تأكد من حذف البيانات القديمة في Railway
   - (السكريبت سيفعل ذلك تلقائياً)

2. **حجم الملف**: 13.17 MB - يجب أن يكون هناك مساحة كافية

3. **الوقت المتوقع**: 2-15 دقيقة حسب سرعة الإنترنت

4. **إذا حدث خطأ**: أعد المحاولة أو استخدم طريقة أخرى

5. **النسخ الاحتياطية**: النسخة الأصلية محفوظة في `railway_backup_full.sql`

---

## 🔄 بعد النقل الناجح

1. **تحديث الـ Environment Variables** (إذا لزم الأمر):
   - تأكد أن `DATABASE_URL` في Railway يشير إلى قاعدة البيانات الجديدة

2. **اختبار التطبيق**:
   - https://web-production-9efff.up.railway.app
   - اختبر جميع الميزات الأساسية

3. **مراقبة الأداء**:
   - تحقق من لوحة تحكم Railway

---

## 🆘 استكشاف الأخطاء

### الخطأ: "Connection timeout"
- قد تكون هناك مشكلة في الشبكة
- جرب استخدام VPN أو جرب لاحقاً

### الخطأ: "Permission denied"
- تأكد من بيانات الاتصال صحيحة
- جرب reset password على Railway

### الخطأ: "Database doesn't exist"
- تأكد من اسم قاعدة البيانات: `railway`
- قد تحتاج لإنشاء قاعدة البيانات أولاً

---

## 📞 دعم إضافي

إذا واجهت مشاكل:
1. تحقق من حالة خدمة Railway
2. تأكد من الاتصال بالإنترنت
3. جرب من جهاز مختلف
4. اتصل بـ Railway Support: https://support.railway.app

---

**تم إنشاء هذا الملف التوجيهي بواسطة السكريبت: `backup_and_restore_railway.mjs`**

التاريخ: 2026-03-23
