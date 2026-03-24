# 📊 فصل جداول الطلبات - وثيقة البنية

## المشكلة السابقة
كانت جميع الطلبات (من متاجر الشحن والمتاجر العادية) مختلطة في جدول واحد `orders`، مما أسبب:
- ❌ التباس في البيانات
- ❌ أخطاء في حساب الديون
- ❌ صعوبة في الصيانة والتطوير

## الحل الجديد - الفصل التام

### 1️⃣ جدول `topup_orders` - لمتاجر الشحن فقط
**الاستخدام**: طلبات الشراء للعملاء الفرديين في متاجر الشحن

```sql
-- للعثور على طلبات عميل معين في متجر شحن
SELECT * FROM topup_orders 
WHERE customer_id = ? 
ORDER BY created_at ASC
```

**الـ Endpoints المرتبطة**:
- `POST /api/topup/orders` - إنشاء طلب شحن جديد
- `GET /api/topup/customers/:customerId/statement` - كشف حساب العميل (يستخدم `topup_orders`)

### 2️⃣ جدول `orders` - للمتاجر العادية فقط
**الاستخدام**: طلبات الشراء من الموقع (العملاء بدون حساب)

```sql
-- للعثور على طلبات عميل معين في متجر عادي
SELECT * FROM orders 
WHERE customer_id = ? 
  AND customer_id NOT IN (
    SELECT DISTINCT customer_id FROM topup_orders
  )
ORDER BY created_at ASC
```

**الـ Endpoints المرتبطة**:
- `POST /api/orders` - إنشاء طلب جديد من الموقع
- `GET /api/customers/:id/statement` - كشف حسابات المتاجر العادية

### 3️⃣ جدول `customer_payments` - للدفعات
**الاستخدام**: جميع الدفعات (سواء من متاجر شحن أو عادية)

```sql
-- للعثور على جميع دفعات عميل معين
SELECT * FROM customer_payments 
WHERE customer_id = ? 
ORDER BY created_at ASC
```

## صيغة حساب الديون

### لعملاء متاجر الشحن:
```
الديون الحالية = ديون سابقة + شراءات من topup_orders - دفعات من customer_payments
```

### لعملاء المتاجر العادية:
```
الديون الحالية = شراءات من orders - دفعات من customer_payments
```

## القواعد الجديدة

✅ **يجب على مستقبلاً**:
1. **استخدم `topup_orders`** عند التعامل مع طلبات متاجر الشحن فقط
2. **استخدم `orders`** عند التعامل مع طلبات المتاجر العادية فقط
3. **استخدم `customer_payments`** للدفعات من أي مصدر

❌ **لا تفعل**:
1. ❌ لا تخلط بين `topup_orders` و `orders` في query واحد
2. ❌ لا تثق في حقل `topup_customer_id` في جدول `orders`
3. ❌ لا تبحث عن طلبات متجر شحن في جدول `orders`

## مثال عملي

### ❌ خطأ (قديم):
```typescript
// لا تفعل هذا - يخلط البيانات
const result = await pool.query(`
  SELECT * FROM orders 
  WHERE topup_customer_id = $1 OR customer_id = $1
`, [customerId]);
```

### ✅ صحيح (جديد):
```typescript
// للعملاء في متاجر الشحن
const result = await pool.query(`
  SELECT * FROM topup_orders 
  WHERE customer_id = $1
  ORDER BY created_at ASC
`, [customerId]);

// للعملاء في المتاجر العادية
const result = await pool.query(`
  SELECT * FROM orders 
  WHERE customer_id = $1
  ORDER BY created_at ASC
`, [customerId]);
```

## التعديلات المطبقة

✅ تم تحديث الـ endpoints التالية:
- `/api/topup/customers/:customerId/statement` - يستخدم `topup_orders` فقط
- `/api/admin/recalculate-debt` - يستخدم `topup_orders` فقط
- جميع الدوال ذات الصلة

## الفوائد

1. ✅ **وضوح البيانات**: كل جدول له غرض واحد واضح
2. ✅ **تجنب الأخطاء**: لا يمكن الخلط بين نوعي الطلبات
3. ✅ **أداء أفضل**: الـ queries أبسط وأسرع
4. ✅ **سهولة الصيانة**: سهل فهم وتطوير الكود
5. ✅ **أمان أفضل**: لا يمكن تسرب بيانات بين النظامين
