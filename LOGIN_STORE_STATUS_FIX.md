# إصلاح مشكلة الدخول: "متجرك قيد المراجعة"

## المشكلة
جميع التجار (ما عدا الآدمن) كانوا يرون رسالة "متجرك قيد المراجعة" حتى لو كان متجرهم مُفعّل بالفعل.

### جذر المشكلة
1. **Backend (server.ts)**:
   - عند تسجيل الدخول، الـ API كان يرجع فقط `store_type` بدون إرجاع حالة المتجر (`is_active`, `status`)
   - صفحة الـ Frontend تحتاج هذه المعلومات لتحديد ما إذا كان يجب عرض الرسالة أم لا

2. **Frontend (App.tsx)**:
   - الشرط الأصلي: `if (user?.role === 'merchant' && !user.store_active)`
   - هذا الشرط كان يصحيح في الحالات القديمة، لكن لم يكن يأخذ `store_status` في الاعتبار

## الحل

### 1. تحديث Backend (server.ts)
تعديل endpoint `/api/login` ليرجع حقول إضافية عن المتجر:

```typescript
// Get store info if user is a merchant
let store_type = null;
let store_active = true;
let store_status = 'active';
if (user.role === 'merchant' && user.store_id) {
  const storeResult = await pool.query(
    "SELECT store_type, is_active, status FROM stores WHERE id = $1",
    [user.store_id]
  );
  if (storeResult.rows.length > 0) {
    store_type = storeResult.rows[0].store_type;
    store_active = storeResult.rows[0].is_active;
    store_status = storeResult.rows[0].status;
  }
}

res.json({
  id: user.id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  email: user.email,
  store_id: user.store_id,
  store_type: store_type,
  store_active: store_active,        // الحقل الجديد
  store_status: store_status         // الحقل الجديد
});
```

### 2. تحديث Frontend (App.tsx)
تحديث الشرط للتحقق من أن المتجر مُفعّل ولديه حالة صحيحة:

```typescript
// القديم:
if (user?.role === 'merchant' && !user.store_active) {

// الجديد:
if (user?.role === 'merchant' && (!user.store_active || (user.store_status && user.store_status !== 'approved' && user.store_status !== 'active'))) {
```

**الشرط الجديد يعني:**
- إظهار الرسالة إذا:
  - المستخدم تاجر (`role === 'merchant'`)
  - **و** (`!user.store_active` أو `store_status` ليست "approved" و ليست "active")
- إظهار لوحة التحكم إذا:
  - المستخدم تاجر
  - **و** المتجر نشط (`store_active === true`)
  - **و** حالة المتجر صحيحة (`store_status === 'approved'` أو `'active'`)

## حالات الاستخدام

### حالة 1: متجر جديد (منتظر الموافقة)
```json
{
  "store_id": 12,
  "store_active": false,
  "store_status": "pending"
}
```
**النتيجة:** ✓ يظهر "متجرك قيد المراجعة"

### حالة 2: متجر مفعّل (موافق عليه)
```json
{
  "store_id": 12,
  "store_active": true,
  "store_status": "approved"
}
```
**النتيجة:** ✓ يفتح لوحة التحكم

### حالة 3: متجر مرفوض
```json
{
  "store_id": 12,
  "store_active": false,
  "store_status": "rejected"
}
```
**النتيجة:** ✓ يظهر "متجرك قيد المراجعة" (مع رسالة مختلفة إن أمكن)

## خطوات الاختبار

### 1. إنشاء متجر جديد (بدون موافقة)
```bash
curl -X POST http://localhost:3000/api/register-merchant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "07700000001",
    "password": "test123",
    "store_name": "Test Store",
    "category": "عام",
    "email": "test@test.com",
    "storeType": "topup"
  }'
```

### 2. اختبار الدخول (يجب أن يظهر "قيد المراجعة")
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "07700000001", "password": "test123"}'
```

**النتيجة:**
```json
{
  "store_id": 12,
  "store_active": false,
  "store_status": "pending"
}
```

### 3. موافقة الآدمن على المتجر
```bash
curl -X POST http://localhost:3000/api/admin/approve-store/12
```

### 4. اختبار الدخول مرة أخرى (يجب الآن فتح لوحة التحكم)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "07700000001", "password": "test123"}'
```

**النتيجة:**
```json
{
  "store_id": 12,
  "store_active": true,
  "store_status": "approved"
}
```

## الملفات المعدلة
- [server.ts](server.ts#L543-L592) - تحديث endpoint `/api/login`
- [src/App.tsx](src/App.tsx#L2754) - تحديث الشرط للتحقق من حالة المتجر

## الحالة
✅ **انتهى الإصلاح** - تم اختبار وتأكيد أن:
- المتاجر الجديدة تعرض الرسالة بشكل صحيح
- المتاجر المفعّلة تفتح لوحة التحكم بشكل صحيح
- التسليم الصحيح بين الآدمن والتجار يعمل بشكل صحيح
