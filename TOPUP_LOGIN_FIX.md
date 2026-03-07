# إصلاح مشكلة الدخول لمتاجر البطاقات (متاجر الكارتات)

## المشكلة
كان الدخول للمتاجر العادية يعمل بشكل طبيعي، لكن الدخول لمتجر كارتات الموبايل لم يكن يعمل. السبب هو أن نظام التسجيل لم يكن يتحقق من نوع المتجر (store_type) ولم يكن يوجه المستخدم للمسار الصحيح.

## الحل

### 1. تعديل Backend (server.ts)
تم تعديل endpoint `/api/login` ليرجع حقل `store_type` إضافة إلى البيانات الأخرى:

```typescript
// Login endpoint - الآن يرجع store_type
app.post("/api/login", async (req, res) => {
  // ... الكود الموجود ...
  
  // Get store_type if user is a merchant
  let store_type = null;
  if (user.role === 'merchant' && user.store_id) {
    const storeResult = await pool.query(
      "SELECT store_type FROM stores WHERE id = $1",
      [user.store_id]
    );
    if (storeResult.rows.length > 0) {
      store_type = storeResult.rows[0].store_type;
    }
  }
  
  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    email: user.email,
    store_id: user.store_id,
    store_type: store_type  // الحقل الجديد
  });
});
```

### 2. تعديل Frontend (App.tsx)
تم تعديل دالة `handleLogin` لتوجيه المستخدم بناءً على نوع المتجر:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (res.ok) {
      const user = await res.json();
      setUser(user);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'merchant') {
        // Check if merchant has a topup store
        if (user.store_type === 'topup') {
          navigate('/topup-merchant');  // الآن يذهب لمتجر الكارتات
        } else {
          navigate('/merchant');        // المتاجر العادية كالمعتاد
        }
      }
      else navigate('/');
    }
  } catch (err) {
    setError('حدث خطأ ما');
  }
};
```

### 3. تعديل Types (types.ts)
تم إضافة حقل `store_type` إلى واجهة `User`:

```typescript
export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'admin' | 'merchant' | 'customer';
  store_active?: boolean;
  store_status?: 'pending' | 'active' | 'suspended' | 'rejected';
  store_id?: number;
  store_type?: 'regular' | 'topup';  // الحقل الجديد
}
```

## نتيجة الإصلاح

### قبل الإصلاح:
- ✗ جميع التجار يتم توجيههم إلى `/merchant` بغض النظر عن نوع متجرهم
- ✗ تجار البطاقات لم يتمكنوا من الوصول إلى واجهة `/topup-merchant`
- ✗ الخطأ في الدخول من المتاجر التي كارتات

### بعد الإصلاح:
- ✓ تاجر متجر عادي يتم توجيهه إلى `/merchant`
- ✓ تاجر متجر كارتات يتم توجيهه إلى `/topup-merchant`
- ✓ استخدام البيانات الحقيقية من قاعدة البيانات لتحديد نوع المتجر

## اختبار الإصلاح

### 1. إنشاء متجر كارتات جديد:
```bash
curl -X POST http://localhost:3000/api/register-merchant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "07700000001",
    "password": "test123",
    "store_name": "Test Topup Store",
    "category": "عام",
    "email": "test@test.com",
    "storeType": "topup"
  }'
```

### 2. اختبار التسجيل:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "07700000001",
    "password": "test123"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "id": 14,
  "name": "Test User",
  "phone": "07700000001",
  "role": "merchant",
  "email": "test@test.com",
  "store_id": 12,
  "store_type": "topup"
}
```

### 3. من الواجهة:
1. افتح http://localhost:5173/login
2. أدخل: phone = `07700000001`, password = `test123`
3. اضغط "تسجيل الدخول"
4. ستتم إعادة التوجيه إلى `/topup-merchant` بدلاً من `/merchant`

## الملفات المعدلة
- [server.ts](server.ts#L543) - تعديل endpoint `/api/login`
- [src/App.tsx](src/App.tsx#L718) - تعديل دالة `handleLogin`
- [src/types.ts](src/types.ts#L1) - إضافة `store_type` إلى واجهة `User`

## الحالة
✅ **انتهى الإصلاح بنجاح** - تم اختبار الإصلاح والتحقق من أن التجار يتم توجيههم للمسار الصحيح
