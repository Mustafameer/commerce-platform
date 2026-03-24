# 🔄 Database Sync Guide

## مثال عملي لمزامنة قواعد البيانات

### الخطوة 1️⃣: الحصول على رابط اتصال Railway

1. اذهب إلى: https://railway.app/dashboard
2. اختر مشروعك (`web-production-9efff`)
3. اختر خدمة PostgreSQL
4. انسخ قيمة `DATABASE_URL` من تبويب الـ Variables

**الشكل المتوقع:**
```
postgresql://postgres:PASSWORD@HOST:5432/railway?sslmode=require
```

### الخطوة 2️⃣: تشغيل مزامنة البيانات

#### الخيار 1: تمرير الرابط كمعامل
```bash
node compare_and_sync_db_v2.mjs "postgresql://postgres:PASSWORD@HOST:5432/railway"
```

#### الخيار 2: استخدام متغير البيئة
```bash
set RAILWAY_DB_URL=postgresql://postgres:PASSWORD@HOST:5432/railway
node compare_and_sync_db_v2.mjs
```

#### الخيار 3: في ملف .env
أضف هذا السطر إلى ملف `.env`:
```
RAILWAY_DB_URL=postgresql://postgres:PASSWORD@HOST:5432/railway
```

ثم شغل:
```bash
node compare_and_sync_db_v2.mjs
```

---

## ✅ ماذا سيفعل السكريبت

### المرحلة 1️⃣: المقارنة
- ✓ عد الجداول في كلا قاعدة البيانات
- ✓ مقارنة هيكل الأعمدة
- ✓ التحقق من العلاقات (Foreign Keys)

### المرحلة 2️⃣: المزامنة
- ✓ ترتيب الجداول حسب التبعيات
- ✓ نقل جميع البيانات صفاً تلو الآخر
- ✓ التعامل مع العلاقات تلقائياً

### المرحلة 3️⃣: التحقق
- ✓ عد الصفوف في كل جدول
- ✓ التأكد من تطابق البيانات

---

## 🔐 أمثلة اتصالات

### الاتصال المحلي (فعلي)
```
postgresql://postgres:123@localhost:5432/multi_ecommerce
```

### الاتصال مع Railway (نموذج)
```
postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@web-production-9efff.up.railway.app:5432/railway?sslmode=require
```

---

## ⚠️ ملاحظات مهمة

1. **النسخ الاحتياطية**: قم بنسخ احتياطية من البيانات قبل المزامنة
2. **الإذونات**: تأكد من أن الحساب له حق الوصول للقراءة والكتابة
3. **SSL**: استخدم دائماً `sslmode=require` مع Railway
4. **العلاقات**: ستتم المزامنة مع الحفاظ على جميع العلاقات

---

## 🆘 حل المشاكل

### مشكلة: "SSL connections not supported"
**الحل**: تأكد من استخدام رابط Railway الصحيح مع `sslmode=require`

### مشكلة: "Connection refused"
**الحل**: تحقق من:
- قاعدة البيانات المحلية تعمل (`localhost:5432`)
- رابط Railway صحيح ودقيق

### مشكلة: "Foreign key constraint violation"
**الحل**: تم إصلاح هذا تلقائياً بترتيب الجداول حسب التبعيات

---

## 📊 التقرير النهائي

بعد انتهاء السكريبت، ستحصل على:
- ✅ عدد الجداول المنقولة
- ✅ عدد الصفوف المنقولة
- ✅ قائمة بأي أخطاء (إن وجدت)

---

## 🎯 ماذا بعد؟

بعد نجاح المزامنة:
1. اختبر التطبيق عليه Railway
2. تحقق من البيانات في السحابة
3. اختبر جميع الواظائف الرئيسية

**استمتع بقاعدة البيانات المزامنة! 🚀**
