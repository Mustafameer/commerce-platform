# دليل إعداد Supabase الكامل

## 📋 الخطوة 1: الحصول على بيانات الاتصال من Supabase

### 1.1 ادخل إلى Supabase Dashboard
- اذهب إلى: https://supabase.com/dashboard
- اختر مشروعك: `bsmrdgherargogbleofh`

### 1.2 احصل على بيانات الاتصال
1. انقر على **Settings** (⚙️) في الشريط الجانبي
2. اختر **Database** من القائمة اليسرى
3. ابحث عن **Connection string** وانسخ الجزء التالي:

```
postgresql://[user]:[password]@[host]:[port]/postgres
```

### 1.3 بيانات الاتصال ستكون مثل هذا:
```
URL: postgresql://postgres:[PASSWORD]@api.supabase.co:5432/postgres
```

---

## 📝 الخطوة 2: إنشاء الجداول في Supabase

### 2.1 افتح SQL Editor
1. في Supabase Dashboard
2. اذهب إلى **SQL Editor** من الشريط الجانبي
3. انقر على **New Query**

### 2.2 انسخ وشغل الـ SQL Schema
1. افتح ملف `supabase_schema.sql` من المشروع
2. انسخ جميع المحتوى
3. الصقه في SQL Editor
4. انقر على **Run** أو اضغط `Ctrl+Enter`

✅ سيتم إنشاء جميع الجداول والفهارس تلقائياً

---

## 🔄 الخطوة 3: نسخ البيانات من PostgreSQL المحلي إلى Supabase

### الطريقة 1: استخدام PgBackRest (الأسهل)

#### على Windows:
```powershell
# 1. حمّل pg_dump (يأتي مع PostgreSQL)
# 2. من terminal:

# قم بأخذ backup من قاعدتك المحلية:
pg_dump -h localhost -U postgres -d multi_ecommerce -F plain > backup.sql

# ثم استيراده في Supabase:
psql -h api.supabase.co -U postgres -d postgres -f backup.sql
```

### الطريقة 2: استخدام Supabase CLI

```powershell
# 1. ثبّت Supabase CLI:
npm install -g supabase

# 2. استيراد البيانات:
supabase db push --db-url "postgresql://postgres:[PASSWORD]@api.supabase.co:5432/postgres"
```

### الطريقة 3: نقل يدوي للبيانات (للبيانات القليلة)

```sql
-- من Supabase SQL Editor:

-- 1. نقل المستخدمين:
INSERT INTO users (name, phone, password, role, email, is_active, created_at)
VALUES 
  ('Admin User', '07700000000', 'password123', 'admin', 'admin@example.com', TRUE, NOW()),
  ('Merchant 1', '07701111111', 'password123', 'merchant', 'merchant1@example.com', TRUE, NOW());

-- 2. نقل المتاجر:
INSERT INTO stores (owner_id, store_name, slug, description, owner_name, is_active, status)
VALUES
  (2, 'متجري الأول', 'my-first-store', 'وصف المتجر', 'صاحب المتجر', TRUE, 'approved');

-- وهكذا...
```

---

## 🔌 الخطوة 4: تحديث الكود للنقاء إلى Supabase

### 4.1 نسخ بيانات الاتصال

```bash
# في Supabase Dashboard -> Settings -> Database -> Connection string:
# انسخ الـ URI الكاملة
```

### 4.2 تحديث ملف `.env`

```env
# استبدل هذا:
DATABASE_URL=postgresql://postgres:123@localhost:5432/multi_ecommerce

# بـ هذا:
DATABASE_URL=postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@api.supabase.co:5432/postgres

# تأكد من استبدال:
# - [YOUR_SUPABASE_PASSWORD] بـ كلمة المرور من Supabase
# - api.supabase.co بـ الـ Host من Supabase
```

### 4.3 الملفات المطلوبة تحديثها:

```
server.ts  ✓ سيستخدم DATABASE_URL من .env
src/App.tsx  ✓ لا يحتاج تحديث (يستخدم API فقط)
```

---

## ✅ الخطوة 5: اختبار الاتصال

### 5.1 اختبار من Node.js

```javascript
// اختبر قبل البدء:
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Connection failed:', err);
  } else {
    console.log('✅ Connection successful!', result.rows[0]);
  }
});
```

### 5.2 اختبر التطبيق محلياً

```powershell
# ثبّت المعتمديات:
npm install

# شغّل الخادم:
npm run dev

# زيارة:
# http://localhost:3000/api/stores
# يجب أن تحصل على البيانات من Supabase
```

---

## 🚀 الخطوة 6: نشر التطبيق

### خيار 1: نشر على Render (للـ Backend)

#### 6.1 إنشاء حساب على Render
- اذهب إلى https://render.com
- اختر **Sign up with GitHub**
- وصّل repository

#### 6.2 ربط Database

```bash
# في Render Dashboard:
1. اذهب إلى Environment
2. أضف متغير:
   DATABASE_URL=postgresql://postgres:...@api.supabase.co:5432/postgres
```

#### 6.3 Deploy

```bash
1. انقر على **Deploy**
2. اختر **Node/Express**
3. اضغط **Deploy**
```

### خيار 2: نشر على Netlify (للـ Frontend)

#### 7.1 بناء وتحضير

```powershell
npm run build
```

#### 7.2 رفع إلى Netlify

```bash
1. اذهب إلى https://netlify.com
2. Sign in with GitHub
3. اختر repository
4. اضغط **Deploy**
```

---

## 🔐 اعتبارات الأمان

### ⚠️ لا تنسى:

1. **متغيرات البيئة**:
   - ✅ حفظ `DATABASE_URL` في `.env` فقط
   - ✅ عدم رفع `.env` إلى GitHub
   - ✅ استخدام متغيرات من البيئة في Render/Netlify

2. **كلمات المرور**:
   - ✅ تغيير كلمة سر Admin من SQL
   - ✅ تفعيل HTTPS على الموقع
   - ✅ استخدام JWT tokens للمصادقة

3. **قواعد الأمان**:
   - ✅ تفعيل Row Level Security (RLS) في Supabase
   - ✅ تقييد الوصول حسب الدور

---

## 🆘 استكشاف الأخطاء

### خطأ: "Connection refused"
```
✓ تأكد من DATABASE_URL صحيح
✓ تحقق من اتصال الإنترنت
✓ هل Supabase متاح؟ (https://status.supabase.com)
```

### خطأ: "Authentication failed"
```
✓ انسخ كلمة المرور من Supabase مرة أخرى (قد تحتوي على رموز خاصة)
✓ استخدم URL encoding: @ = %40, : = %3A, إلخ
```

### خطأ: "Relation does not exist"
```
✓ تأكد من تشغيل supabase_schema.sql كاملاً
✓ تحقق من أسماء الجداول
✓ ربما تحتاج refresh browser cache
```

---

## 📊 مراقبة الأداء

### في Supabase Dashboard:

1. **Logs**: عرض الأخطاء والتحذيرات
2. **Realtime**: معلومات التوصلات النشطة
3. **Logs**: Database query logs
4. **Usage**: استهلاك العدد

---

## ✅ قائمة التحقق النهائية

- [ ] تم إنشاء SQL Schema بنجاح
- [ ] تم نسخ البيانات (اختياري)
- [ ] تحديث `.env` مع DATABASE_URL
- [ ] اختبار الاتصال محلياً
- [ ] تشغيل `npm run dev` بدون أخطاء
- [ ] نشر Backend على Render
- [ ] نشر Frontend على Netlify
- [ ] اختبار التطبيق من URL الحي
- [ ] تفعيل HTTPS و security headers

---

## 🎉 النتيجة النهائية

بعد إتمام جميع الخطوات، ستحصل على:

```
المشتري: https://your-app.netlify.app
التطبيق كامل: ✅ يعمل
قاعدة البيانات: ✅ Supabase
الخادم: ✅ Render
```

---

**للمساعدة**: DM في Slack أو Telegram 📲
