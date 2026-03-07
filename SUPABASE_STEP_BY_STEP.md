# 📸 خطوات Supabase مع لقطات الشاشة

## الخطوة 1: فتح SQL Editor

```
من الصورة التي أرسلتها:
1. انقر على 🗄️ Database من الشريط الجانبي (أيسر)
2. اختر "SQL Editor"
3. انقر "New Query"
```

## الخطوة 2: لصق التعليمات البرمجية

```sql
-- انسخ كل محتوى supabase_schema.sql
-- والصقه في SQL Editor
-- ثم اضغط "Run" أو Ctrl+Enter
```

## الخطوة 3: الحصول على Connection String

```
من الصورة التي أرسلتها:
1. انقر ⚙️ Settings (الشريط الأسفل في اليسار)
2. اختر "Database" من القائمة
3. ابحث عن "Connection string"
4. تحت "PostgreSQL" انسخ URI الكاملة
```

### شكل الـ URI:
```
postgresql://postgres:[PASSWORD]@api.supabase.co:5432/postgres
```

## الخطوة 4: استبدل في .env

من ملف `.env` الحالي:
```ini
DATABASE_URL=postgresql://postgres:123@localhost:5432/multi_ecommerce
```

استبدله بـ:
```ini
DATABASE_URL=postgresql://postgres:[PASSWORD_FROM_SUPABASE]@api.supabase.co:5432/postgres
```

**مثال حقيقي** (لا تستخدم هذا الكود):
```ini
DATABASE_URL=postgresql://postgres:abc123XYZ@api.supabase.co:5432/postgres
```

---

## 🎯 ماذا بعد؟

بعد تحديث `.env`:

```powershell
# في Terminal

# إيقاف الخادم القديم
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# انتظر ثانية
Start-Sleep -Seconds 2

# شغّل الخادم من جديد
npm run dev
```

---

## ✅ اختبر النتيجة

افتح في المتصفح:
```
http://localhost:3000/api/stores
```

**يجب أن ترى**:
```json
[
  {
    "id": 1,
    "store_name": "متجري",
    "slug": "my-store",
    ...
  }
]
```

إذا كانت النتيجة JSON = ✅ **نجح الاتصال!**

---

## ⚠️ أخطاء شائعة

### خطأ: "relation \"users\" does not exist"
```
✓ لم تشغّل SQL schema بعد
✓ اذهب إلى SQL Editor وشغّل supabase_schema.sql
```

### خطأ: "password authentication failed"
```
✓ كلمة المرور من Supabase خاطئة
✓ انسخها مرة أخرى من Settings → Database
✓ بعض الرموز قد تحتاج URL encoding
```

### خطأ: "connect ECONNREFUSED"
```
✓ قد تستخدم DATABASE_URL القديمة (localhost)
✓ تأكد من تغييرها إلى Supabase URL
✓ أعد تشغيل الخادم: npm run dev
```

---

## 📱 الخطوات المقادة

**الآن سأساعدك بخطوات مباشرة:**

1. ✅ افتح Supabase Dashboard
2. ✅ اذهب إلى SQL Editor
3. ✅ أنسخ supabase_schema.sql كاملاً
4. ✅ شغّل في SQL Editor
5. ✅ اذهب إلى Settings → Database
6. ✅ انسخ Connection String
7. ✅ حدّث .env
8. ✅ اختبر npm run dev

---

**هل تحتاج إلى أي توضيح لأي خطوة؟ 🤔**
