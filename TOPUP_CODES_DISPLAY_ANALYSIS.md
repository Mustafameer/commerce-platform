# تحليل نظام عرض الأكواد في TopupStorefront

## 🎯 ملخص سريع
يتم عرض أكواد الشراء في نافذة تأكيد الطلب وصفحة تفاصيل الطلب. النظام يدعم عرض الأكواد في جدول وفي شكل قوائم قابلة للنسخ.

---

## 1️⃣ المكان الذي يتم عرض "لا توجد أكواد" فيه

### في نافذة تأكيد الطلب (Order Confirmation)
**الملف:** [src/App.tsx](src/App.tsx#L1219)

```tsx
// السطر 1219 - عرض "لا توجد أكواد" في بطاقات الأجهزة الصغيرة
{availableCodes.length > 0 ? (
  <div className="flex flex-col gap-2">
    {availableCodes.map((code: string, cIdx: number) => (
      <div key={cIdx} className={...}>
        {code}
      </div>
    ))}
  </div>
) : (
  <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>
)}
```

**السطر 1293** - نفس المنطق في الجدول:
```tsx
{availableCodes.length > 0 ? (
  <div className="flex flex-col gap-2">
    {availableCodes.map((code: string, cIdx: number) => (
      <div key={cIdx} className={...}>
        {code}
      </div>
    ))}
  </div>
) : (
  <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>
)}
```

---

## 2️⃣ جدول عرض الأكواد

### في نافذة تأكيد الطلب
**الملف:** [src/App.tsx](src/App.tsx#L1228)

**الهيكل:**
```
┌─────────────────────┬──────────┬──────────────────┐
│   اسم المنتج        │ الكمية   │     الأكواد      │
├─────────────────────┼──────────┼──────────────────┤
│ زين - 250 ألف      │    2     │ CODE-001         │
│                     │          │ CODE-002         │
├─────────────────────┼──────────┼──────────────────┤
│ آسيا - 500 ألف     │    3     │ CODE-003         │
│                     │          │ CODE-004         │
│                     │          │ CODE-005         │
└─────────────────────┴──────────┴──────────────────┘
```

**الكود:**
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>اسم المنتج</th>
      <th>الكمية</th>
      <th>الأكواد</th>
    </tr>
  </thead>
  <tbody>
    {orderConfirmation.confirmations.map((conf: any, idx: number) => 
      conf.items.map((item: any, itemIdx: number) => {
        const codes = conf.codes;
        const displayQuantity = item.quantity || 0;
        const availableCodes = codes.slice(0, displayQuantity);
        
        return (
          <tr>
            <td>{displayName}</td>
            <td>{displayQuantity}</td>
            <td>
              {availableCodes.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {availableCodes.map((code: string) => (
                    <div key={cIdx}>{code}</div>
                  ))}
                </div>
              ) : (
                <span>لا توجد أكواد متاحة</span>
              )}
            </td>
          </tr>
        );
      })
    )}
  </tbody>
</table>
```

---

## 3️⃣ API Endpoints التي تتعامل مع ترجيع الأكواد

### API Endpoint 1: إنشاء الطلب + تسليم الأكواد
**Endpoint:** `POST /api/topup/purchase`
**الملف:** [server.ts](server.ts#L5590)

**ما يفعله:**
1. ينشئ طلب جديد بحالة `completed`
2. يجلب أول X أكواد من جدول `topup_products` (حسب الكمية المطلوبة)
3. يحذف الأكواد المستخدمة من `topup_products` (يخفظ الأكواد المتبقية فقط)
4. يسجل الأكواد المستخدمة في جدول `order_items`

**الكود - جزء استخراج الأكواد:**
```typescript
// Line 5782-5819
const productResult = await pool.query(
  `SELECT codes, images FROM topup_products WHERE id = $1`,
  [topup_product_id]
);

if (productResult.rows.length > 0) {
  const product = productResult.rows[0];
  let codesArray = product.codes;
  
  // Parse codes if stored as string
  if (typeof codesArray === 'string') {
    codesArray = JSON.parse(codesArray);
  }
  
  if (!Array.isArray(codesArray)) {
    codesArray = [];
  }
  
  console.log(`🔑 Current codes available: ${codesArray.length}`);
  
  if (codesArray.length > 0) {
    // حذف الأكواد المستخدمة
    const remainingCodes = codesArray.slice(quantity);
    console.log(`🗑️  Removed ${quantity} codes. Remaining: ${remainingCodes.length}`);
    
    // تحديث المنتج بالأكواد المتبقية
    await pool.query(
      `UPDATE topup_products SET codes = $1, available_codes = $2 WHERE id = $3`,
      [remainingCodes, remainingCodes.length, topup_product_id]
    );
  }
}
```

---

### API Endpoint 2: جلب الأكواد بعد الشراء
**Endpoint:** `GET /api/topup/order-codes/:orderId`
**الملف:** [server.ts](server.ts#L5935)

**ما يفعله:**
1. يبحث عن الطلب في جدول `orders`
2. يجلب `order_items` الخاصة بالطلب
3. يعاود البحث عن الأكواد من جدول `topup_products` (⚠️ **هذا مشكلة!** الأكواد تم حذفها)
4. يرجع الأكواد الموجودة في `products.codes` الحالية

**الكود:**
```typescript
// Line 5935-5912
app.get("/api/topup/order-codes/:orderId", async (req, res) => {
  const { orderId } = req.params;

  // Fetch order
  const orderResult = await pool.query(
    `SELECT id, store_id, status FROM orders WHERE id = $1`,
    [orderId]
  );

  // Fetch order items
  const itemsResult = await pool.query(
    `SELECT topup_product_id, quantity FROM order_items WHERE order_id = $1`,
    [orderId]
  );

  // Fetch codes for each item (⚠️ ISSUE: codes were deleted from topup_products!)
  let allCodes: string[] = [];
  for (const item of itemsResult.rows) {
    const productResult = await pool.query(
      `SELECT codes FROM topup_products WHERE id = $1`,
      [item.topup_product_id]
    );

    if (productResult.rows.length > 0) {
      const product = productResult.rows[0];
      if (product.codes && Array.isArray(product.codes)) {
        // "خذ أول X أكواد" - لكن هذه قد تكون أكواد جديدة!
        const codesToAdd = product.codes.slice(0, item.quantity);
        allCodes = [...allCodes, ...codesToAdd];
      }
    }
  }

  res.json({
    order_id: orderId,
    codes: allCodes,
    count: allCodes.length
  });
});
```

---

## 4️⃣ صفحة عرض تفاصيل الطلب (`TopupOrderDetails`)

**المكان:** [src/App.tsx](src/App.tsx#L14162)

**الدالة:**
```tsx
const TopupOrderDetails = () => {
  const { storeId, orderId } = useParams();
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch order codes from API
    fetch(`/api/topup/order-codes/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setCodes(data.codes);  // Array of codes
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading codes:', error);
        setLoading(false);
      });
  }, [orderId]);

  return (
    <div>
      {/* عرض كل كود في صندوق منفصل */}
      {codes.map((code, idx) => (
        <div key={idx} className="p-4 rounded-lg border-2 font-mono text-lg">
          {code}
        </div>
      ))}
      
      {/* زر نسخ جميع الأكواد */}
      <button onClick={() => {
        navigator.clipboard.writeText(codes.join('\n'));
      }}>
        نسخ الأكواد
      </button>
    </div>
  );
};
```

---

## 5️⃣ Flow كامل لعملية الشراء

### في `handleConfirmOrder` في `src/App.tsx` (Lines 1037-1156):

```
1. User clicks إتمام الطلب
   ↓
2. For each topup item:
   a. POST /api/topup/purchase {
      store_id, topup_product_id, quantity, 
      customer_id, phone, total_amount
   }
   ↓
   b. Server:
      - Creates order (status: completed)
      - Fetches codes from topup_products
      - Removes used codes from topup_products
      - Returns order_id
   ↓
   c. Frontend: GET /api/topup/order-codes/{order_id}
      - Server fetches codes from topup_products
      - Returns available codes
   ↓
   d. Save codes to state: itemCodes = [...]
   ↓
3. Collect all codes from all items
   ↓
4. CREATE orderConfirmation object:
   {
     confirmations: [
       {
         orderId: "13-123456",
         items: [...],
         codes: [CODE-001, CODE-002, ...]
       }
     ]
   }
   ↓
5. Render OrderConfirmation with codes visible
```

---

## 6️⃣ حالات عدم وجود أكواد

### المتطلبات:
- `availableCodes.length === 0` في شرط العرض

### الأسباب المحتملة:
1. ❌ لم يتم رفع أكواد للمنتج في البداية
2. ❌ جميع الأكواد تم استخدامها بالفعل
3. ❌ خطأ في جلب الأكواد من API
4. ❌ المنتج تم حذفه أو تعديله

### الرسالة المعروضة:
```tsx
<span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>
```

---

## 7️⃣ جداول Database المرتبطة

### `topup_products` - تخزين الأكواد الأصلية:
```sql
id                    | integer
store_id              | integer
company_id            | integer
name                  | text
amount                | integer
price                 | integer
codes                 | text[]          -- ✅ الأكواد الأصلية (يتم حذف المستخدم)
available_codes       | integer         -- عدد الأكواد المتبقية
images                | text[]          -- صور البطاقات
created_at            | timestamp
```

### `orders` - معلومات الطلب:
```sql
id                    | integer
store_id              | integer
topup_customer_id     | integer         -- معرف عميل الشحن
status                | text            -- 'completed'
is_topup_order        | boolean         -- true
total_amount          | numeric
created_at            | timestamp
```

### `order_items` - تفاصيل المنتجات في الطلب:
```sql
id                    | integer
order_id              | integer
topup_product_id      | integer
quantity              | integer
price                 | numeric
topup_codes          | text[]          -- ⚠️ مجال غير مستخدم حالياً
```

---

## ⚠️ المشاكل المكتشفة

### مشكلة #1: الأكواد لا تُحفظ بشكل دائم
- الأكواد تُحفظ مباشرة في `topup_products.codes`
- عند الشراء: حذف الأكواد المستخدمة
- عند جلب الأكواد لاحقاً: البحث في `topup_products` قد لا يجدها!

**الحل المقترح:**
- حفظ الأكواد المسندة في جدول `order_codes` جديد محدد للطلب

### مشكلة #2: لا يمكن جلب الأكواد مرتين
- إذا المستخدم عاد لصفحة الطلب مرة أخرى، قد لا يجد الأكواد

**الحل المقترح:**
- حفظ في `order_items.topup_codes` عند الشراء

---

## 📊 مثال عملي

```json
{
  "orderConfirmation": {
    "confirmations": [
      {
        "orderId": "13-1234567890",
        "items": [
          {
            "name": "250 ألف",
            "company_name": "زين",
            "quantity": 2,
            "price": 250000
          }
        ],
        "codes": ["XY1234567890", "AB9876543210"]
      }
    ]
  }
}
```

يتم عرض:
```
اسم المنتج: زين - 250 ألف
الكمية: 2
الأكواد:
  XY1234567890
  AB9876543210
```

---

## 🔍 الملفات الرئيسية

| الملف | التفاصيل |
|------|---------|
| [src/App.tsx](src/App.tsx#L1154) | عرض تأكيد الطلب مع جدول الأكواد |
| [src/App.tsx](src/App.tsx#L1037) | معالج `handleConfirmOrder` |
| [src/App.tsx](src/App.tsx#L14162) | صفحة `TopupOrderDetails` |
| [server.ts](server.ts#L5590) | `POST /api/topup/purchase` |
| [server.ts](server.ts#L5935) | `GET /api/topup/order-codes` |

