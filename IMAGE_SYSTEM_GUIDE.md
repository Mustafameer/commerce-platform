# نظام إدارة الصور - دليل الاستخدام

## المميزات الجديدة ✨

### 1. **عدد صور غير محدود لكل منتج**
- كل منتج يمكنه أن يملك من 1 إلى ملايين الصور
- كل صورة مخزنة في صف منفصل بجدول `product_images`
- لا محدودية أكثر في التخزين

### 2. **مستودع محلي للصور** 📁
```
public/uploads/products/
├── 1710606000000-a1b2c3d4e.jpg
├── 1710606005000-f5g6h7i8j.png
└── 1710606010000-k9l0m1n2o.jpeg
```

### 3. **روابط HTTPS دائمة** 🔗
- بدلاً من Base64 (الذي يزيد الحجم 33%)
- حفظ الرابط فقط: `/uploads/products/filename.jpg`
- رابط كامل: `http://localhost:3000/uploads/products/filename.jpg`

---

## Database Schema

### جدول `product_images`
```sql
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,       -- معرف المنتج
  store_id INTEGER NOT NULL,         -- معرف المتجر
  image_url TEXT NOT NULL,           -- رابط الصورة أو Base64
  image_type VARCHAR(50),            -- jpeg, png, webp, svg
  file_size INTEGER,                 -- حجم الملف بـ bytes
  uploaded_at TIMESTAMP,             -- وقت التحميل
  uploaded_by INTEGER                -- معرف المستخدم (اختياري)
);

CREATE INDEX idx_product_images_product_store 
  ON product_images(store_id, product_id);
```

---

## API Endpoints

### 1. رفع صورة جديدة
```bash
POST /api/products/:productId/images

Content-Type: application/json

{
  "store_id": 1,
  "image_url": "https://example.com/image.jpg",  // رابط أو Base64
  "image_type": "jpeg",
  "file_size": 125000
}
```

**Response:**
```json
{
  "success": true,
  "image_id": 42,
  "image_url": "/uploads/products/1710606000000-a1b2c3d4e.jpg",
  "uploaded_at": "2026-03-16T10:14:02.827Z"
}
```

---

### 2. جلب جميع صور المنتج
```bash
GET /api/products/:productId/images?store_id=1
```

**Response:**
```json
{
  "count": 3,
  "images": [
    {
      "id": 1,
      "product_id": 5,
      "store_id": 1,
      "image_url": "/uploads/products/1710606000000-a1b2c3d4e.jpg",
      "image_type": "jpeg",
      "file_size": 125000,
      "uploaded_at": "2026-03-16T10:14:02.827Z"
    },
    ...
  ]
}
```

---

### 3. حذف صورة
```bash
DELETE /api/products/:productId/images/:imageId
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted"
}
```

---

## أمثلة الاستخدام

### JavaScript / Fetch API
```javascript
// تحميل صورة
const formData = new FormData();
formData.append('store_id', 1);
formData.append('image_url', 'https://via.placeholder.com/300');
formData.append('image_type', 'jpeg');

const res = await fetch('/api/products/5/images', {
  method: 'POST',
  body: JSON.stringify({
    store_id: 1,
    image_url: imageDataUrl,  // Base64 من Canvas
    image_type: 'jpeg'
  })
});

// جلب الصور
const images = await fetch('/api/products/5/images?store_id=1')
  .then(r => r.json());

// عرض الصور
images.images.forEach(img => {
  const fullUrl = img.image_url.startsWith('/uploads') 
    ? `http://localhost:3000${img.image_url}`
    : img.image_url;
  console.log(`<img src="${fullUrl}" />`);
});
```

### cURL
```bash
# رفع صورة
curl -X POST http://localhost:3000/api/products/5/images \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": 1,
    "image_url": "https://via.placeholder.com/300",
    "image_type": "jpeg"
  }'

# جلب الصور
curl http://localhost:3000/api/products/5/images?store_id=1

# حذف صورة
curl -X DELETE http://localhost:3000/api/products/5/images/42
```

---

## للمنتجات الـ TopUp

### جدول `topup_product_images` الموجود
```sql
SELECT tp.id, tc.name, tpi.image_data
FROM topup_products tp
LEFT JOIN topup_companies tc ON tp.company_id = tc.id
LEFT JOIN topup_product_images tpi ON tp.id = tpi.topup_product_id
WHERE tp.store_id = 13;
```

**الجديد:** يمكن إضافة نفس endpoints للمنتجات الـ topup:
```bash
POST /api/topup/products/:productId/images
GET  /api/topup/products/:productId/images
DELETE /api/topup/products/:productId/images/:imageId
```

---

## الفوائد مقابل النظام القديم (Base64)

| الميزة | Base64 | الجديد (URLs) |
|--------|--------|-------------|
| **الحجم** | +33% (مثال: 1MB → 1.33MB) | نفس الحجم |
| **السرعة** | بطيء جداً (الاستعلام يحمل MB من البيانات) | سريع جداً |
| **عدد الصور** | محدود (حد أقصى للـ field size) | غير محدود |
| **التحديات** | صعب جداً | سهل جداً |
| **الرابط الثابت** | لا (يتغير مع كل استعلام) | نعم (رابط دائم) |

---

## Migration من Base64

إذا كنت تريد نقل الصور من Base64 الحالية:

```javascript
// 1. قراءة الصور من topup_product_images
const images = await pool.query(`
  SELECT id, topup_product_id, image_data
  FROM topup_product_images
`);

// 2. حفظ كل صورة
for (const img of images.rows) {
  const buffer = Buffer.from(img.image_data, 'base64');
  const fileName = `${Date.now()}-${img.id}.svg`;
  fs.writeFileSync(`public/uploads/products/${fileName}`, buffer);
  
  // 3. إضافة في topup_product_images الجديد
  // await pool.query(`UPDATE topup_product_images SET image_url = $1 WHERE id = $2`, 
  //   [`/uploads/products/${fileName}`, img.id]);
}
```

---

## الحدود الحالية

- ✅ تخزين غير محدود للصور
- ✅ عرض سريع جداً
- ⏳ ضغط الصور تلقائياً (يحتاج Sharp/ImageMagick)
- ⏳ حذف الملفات القديمة تلقائياً
- ⏳ CDN للتوزيع العالمي

---

## الخطوات التالية

1. ✅ إنشاء الـ database tables
2. ✅ إضافة API endpoints
3. ✅ حفظ الصور محلياً
4. ⏳ تحديث الواجهة الأمامية لاستخدام الـ endpoints
5. ⏳ دعم تحميل صور متعددة في وقت واحد
6. ⏳ Firebase Storage (للمستقبل)

---

**إصدار:** 1.0  
**تاريخ:** 16 مارس 2026  
**الحالة:** جاهز للاستخدام ✅
