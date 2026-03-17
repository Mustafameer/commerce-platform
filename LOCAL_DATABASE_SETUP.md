# إعادة بناء قاعدة البيانات محلياً ✅

## 📋 الخطوات الكاملة:

### 1️⃣ تأكد من تشغيل PostgreSQL محلياً
```powershell
# تحقق من الاتصال
psql -U postgres -c "SELECT version();"
```

### 2️⃣ أنشئ قاعدة البيانات المحلية (اختياري - إذا لم تكن موجودة)
```powershell
# قم بإنشاء قاعدة البيانات
createdb -U postgres multi_ecommerce
```

### 3️⃣ ابدأ إعادة البناء
```powershell
# ستحذف جميع الجداول القديمة وتنشئها من جديد مع جدول الصور
node rebuild_db_locally.mjs
```

**المتوقع:**
```
🚀 بدء إعادة بناء قاعدة البيانات محلياً...

🗑️  حذف الجداول القديمة...
✅ تم حذف الجداول القديمة

📋 إنشاء الجداول الجديدة...
✅ تم إنشاء الجداول الأساسية

📊 إنشاء الفهارس...
✅ تم إنشاء الفهارس

📝 إضافة البيانات الأساسية...
✅ تم إنشاء Store 13 (علي الهادي)
✅ تم إنشاء 3 شركات

📦 إضافة منتجات الشحن...
✅ تم إنشاء 3 منتج

🖼️  إضافة صور الشحن...
✅ تم إضافة الصور

✅ التحقق من البيانات:

   📊 المتاجر: 1
   🏢 شركات الشحن: 3
   📦 منتجات الشحن: 3
   🖼️  صور الشحن: 3

🎉 تم بناء قاعدة البيانات بنجاح!
```

### 4️⃣ تحقق من البيانات
```powershell
# تحقق من البيانات المحلية
node verify_db_locally.mjs
```

**المتوقع:**
```
📋 التحقق من قاعدة البيانات المحلية...

🏪 محلات: 1
   ✅ علي الهادي (ID: 13)

🏢 شركات الشحن: 3
   ✅ زين اثير (ID: 1)
   ✅ آسيا سيل (ID: 2)
   ✅ كورك (ID: 3)

📦 منتجات الشحن: 3
   ✅ المبلغ: 35000 ريال | السعر: 40000 ريال | الشركة: زين اثير (ID: 1)
   ✅ المبلغ: 25000 ريال | السعر: 27500 ريال | الشركة: آسيا سيل (ID: 2)
   ✅ المبلغ: 15000 ريال | السعر: 17500 ريال | الشركة: كورك (ID: 3)

🖼️  صور الشحن: 3
   ✅ المنتج ID: 1 | المبلغ: 35000 | الشركة: زين اثير | حجم الصورة: 235 bytes
   ✅ المنتج ID: 2 | المبلغ: 25000 | الشركة: آسيا سيل | حجم الصورة: 228 bytes
   ✅ المنتج ID: 3 | المبلغ: 15000 | الشركة: كورك | حجم الصورة: 228 bytes

✅ قاعدة البيانات جاهزة للاختبار!
```

### 5️⃣ اختبر السرفر محلياً
```powershell
# شغل السرفر في المضموم
npm run dev
```

في terminal آخر، اختبر النقطة النهائية:
```powershell
curl http://localhost:5000/api/setup/images-table
# أو في PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/setup/images-table" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**المتوقع:** JSON بهذا الشكل:
```json
{
  "success": true,
  "message": "Images table already exists or was created successfully",
  "table_created": false,
  "total_images": 3,
  "products_updated": 3,
  "store": 13,
  "note": "All 3 topup products for Store 13 have images"
}
```

### 6️⃣ تصدير ورفع إلى Railway

**الطريقة الأولى: استخدام Railway CLI**
```powershell
# أولاً تأكد من تثبيت Railway
npm install -g @railway/cli

# ادخل المشروع
railway link

# تصدير قاعدة البيانات المحلية
pg_dump -U postgres -d multi_ecommerce > backup.sql

# رفع البيانات إلى Railway
railway db:restore backup.sql
```

**الطريقة الثانية: عبر Dashboard**
```powershell
# تصدير
node export_db_locally.mjs

# ثم اذهب إلى:
# 1. railway.app dashboard
# 2. اختر المشروع
# 3. اذهب إلى PostgreSQL
# 4. اختر Data > Restore
# 5. احمل ملف backup.sql
```

### 7️⃣ تحقق من البيانات على Railway
```powershell
# تأكد من الاتصال برقم مياه البيانات على Railway
$railwayConn = "postgresql://postgres:yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ@postgres.railway.internal:5432/railway"
psql $railwayConn -c "SELECT COUNT(*) as images_count FROM topup_product_images;"
```

---

## 🎯 الملخص السريع

| الخطوة | الأمر | النتيجة المتوقعة |
|-----|------|---------|
| 1 | `node rebuild_db_locally.mjs` | ✅ قاعدة بيانات محلية مع الصور |
| 2 | `node verify_db_locally.mjs` | ✅ 3 منتجات + 3 صور |
| 3 | `npm run dev` | ✅ السرفر يعمل محلياً |
| 4 | `curl http://localhost:5000/api/setup/images-table` | ✅ JSON response |
| 5 | `pg_dump ... > backup.sql` | ✅ تصدير السرفر |
| 6 | رفع backup.sql إلى Railway | ✅ قاعدة بيانات متحدثة |

---

## ⚠️ حل المشاكل

### مشكلة: خطأ الاتصال بـ PostgreSQL
```powershell
# تحقق من تشغيل الخدمة
Get-Service PostgreSQL* | Start-Service
```

### مشكلة: قاعدة البيانات غير موجودة
```powershell
createdb -U postgres multi_ecommerce
```

### مشكلة: النقطة النهائية تعيد HTML
- تأكد من نسخ `distPath` في أعلى `server.ts` (بعد `app = express()`)
- أعد التحميل: `npm run build` ثم `npm run dev`

---

## ✅ بعد الانتهاء

1. قاعدة البيانات المحلية مختبرة وتعمل ✅
2. جدول `topup_product_images` موجود بـ 3 صور ✅
3. النقطة النهائية `/api/setup/images-table` تعيد JSON ✅
4. البيانات مرفوعة إلى Railway وجاهزة ✅

🎉 **انتهينا!**
