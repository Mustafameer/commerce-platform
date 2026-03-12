# 🖼️ نظام تحميل الصور لبطاقات الشحن

## المميزات الجديدة

بدلا من تحميل أكواد نصية، يمكنك الآن تحميل **صور بطاقات الشحن** التي تحتوي على الكود والسيريال نمبر مطبوع عليها.

## الخطوات

### 1️⃣ تحميل الصور
في لوحة التحكم من المتجر:
- انقر على **"رفع الأكواد"** (الزر أصبح يقبل الصور أيضاً)
- اختر منتج شحن من القائمة
- ارفع الصور (JPG, PNG, WebP, إلخ)
- يتم تحويل الصور إلى base64 وحفظها

### 2️⃣ عند البيع
- عند شراء العميل، يتم سحب عدد الصور المطلوبة
- يتم حفظ الصور المستخدمة في جدول `order_images`
- يتم تحديث الصور المتاحة تلقائياً

### 3️⃣ عرض الصور للعميل
استدعي endpoint جديد:
```
GET /api/topup/order-images/:orderId
```

الرد:
```json
{
  "order_id": 123,
  "images": [
    {
      "image_url": "data:image/jpeg;base64,...",
      "image_data": null,
      "product_id": 45,
      "amount": 50000,
      "price": 25000
    }
  ],
  "count": 1
}
```

## قاعدة البيانات

### تعديلات الجداول:

#### 1. topup_products (إضافة عمود جديد)
```sql
ALTER TABLE topup_products 
ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[];
```

#### 2. order_images (جدول جديد)
```sql
CREATE TABLE order_images (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  topup_product_id INTEGER NOT NULL REFERENCES topup_products(id),
  image_url TEXT NOT NULL,
  image_data TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, topup_product_id, image_url)
);
```

## Endpoints الجديدة

### ✅ تحميل الصور
**POST** `/api/topup/upload-images`

**Body:**
```json
{
  "store_id": 1,
  "topup_product_id": 45,
  "images": ["data:image/jpeg;base64,...", "data:image/png;base64,..."]
}
```

**الرد:**
```json
{
  "success": true,
  "message": "تم تحميل صورتان جديدتان بنجاح",
  "product": {
    "id": 45,
    "available_codes": 2
  }
}
```

### ✅ جذب صور الطلب (جديد)
**GET** `/api/topup/order-images/:orderId`

### ✅ جذب أكواد الطلب (القديم - لا يزال معاً)
**GET** `/api/topup/order-codes/:orderId`

## النظام القديم لا يزال يعمل

يمكنك:
- ✅ تحميل الأكواد النصية من ملفات TXT/CSV
- ✅ تحميل الصور الجديدة
- ✅ التسلسل بينهم (أكواد + صور)

## ملفات التعديل

✅ `server.ts`:
- `+69` سطر - endpoint تحميل الصور
- `+5` سطور - تعديل جذب الصور والأكواد
- `+60` سطر - معالجة الصور في البيع

✅ `src/App.tsx`:
- `+40` سطر - دعم تحميل الصور
- `+5` سطور - تحديث الـ Modal

✅ قاعدة البيانات:
- `+1` عمود في `topup_products`
- `+1` جدول جديد `order_images`

## ملفات السكريبتات

- `add_images_column.mjs` - إضافة عمود الصور
- `create_order_images_table.mjs` - إنشاء جدول الصور المستخدمة

## التوافقية

✅ **توافقي تماماً** مع النظام القديم:
- الأكواد النصية تعمل كما هي
- الصور الجديدة تعمل بجانبها
- لا حاجة لتغيير أي كود موجود
