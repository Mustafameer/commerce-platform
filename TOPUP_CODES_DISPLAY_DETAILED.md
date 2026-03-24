# شرح تفصيلي: آلية عرض الأكواد في TopupStorefront

## 📱 الواجهة

### 1. نافذة تأكيد الطلب بعد الشراء مباشرة

#### على الأجهزة الصغيرة (Mobile):
```
╔══════════════════════════════════════════╗
║  ✅ تم تقديم الطلب بنجاح!               ║
╚══════════════════════════════════════════╝

┌──────────────────────────────────────────┐
│ اسم المنتج: زين - 250 ألف               │
│ الكمية: 2                                │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │    CODE-001                        │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │    CODE-002                        │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘

┌─────────────────── أكثر ──────────────────┐
│ لا توجد أكواد متاحة                       │  ← إذا quantity > codes.length
└──────────────────────────────────────────┘
```

#### على الأجهزة الكبيرة (Desktop):
```
╔════════════════════════════════════════════════════════════════╗
║ اسم المنتج      │ الكمية  │ الأكواد                           ║
╠════════════════════════════════════════════════════════════════╣
║ زين - 250 ألف   │   2    │ ┌────────────────────────────────┐ ║
║                 │        │ │ CODE-001                       │ ║
║                 │        │ │ CODE-002                       │ ║
║                 │        │ └────────────────────────────────┘ ║
╠════════════════════════════════════════════════════════════════╣
║ آسيا - 500 ألف  │   3    │ ┌────────────────────────────────┐ ║
║                 │        │ │ CODE-003                       │ ║
║                 │        │ │ CODE-004                       │ ║
║                 │        │ │ CODE-005                       │ ║
║                 │        │ └────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Process Flow - خطوات العملية

```
USER JOURNEY
═══════════════════════════════════════════════════════════════════

[1] المستخدم في TopupStorefront
    └─ يختار المنتج والكمية
    
[2] إضافة للسلة (cart)
    └─ السلة تحتفظ بـ: {product_id, quantity, ...}
    
[3] الضغط على "إتمام الطلب"
    └─ handleConfirmOrder() يُستدعى
        └─ for each item:
           └─ POST /api/topup/purchase
    
[4] Server Response
    ├─ order_id: 142
    ├─ success: true
    └─ BACKEND: تحذف الأكواد المستخدمة من topup_products!
    
[5] Frontend GET /api/topup/order-codes/142
    ├─ جلب data.codes
    └─ حفظ في state
    
[6] عرض orderConfirmation مع الأكواد
    ├─ جدول (desktop)
    ├─ بطاقات (mobile)
    └─ زر "نسخ الأكواد"
    
[7] المستخدم يضغط "العودة للمتجر"
    └─ navigate('/topup/{storeId}')
    
[8] (اختياري) المستخدم يذهب لـ /topup/order/{orderId}
    ├─ GET /api/topup/order-codes/{orderId}
    ├─ عرض الأكواد مرة أخرى
    └─ زر "نسخ الأكواد"
```

---

## 🔍 الأكواد المهمة

### 1️⃣ State في handleConfirmOrder

```typescript
// src/App.tsx: Line 928-1156

const handleConfirmOrder = async () => {
  const orderConfirmations = []; // ← يتجمع هنا
  let allCodes: string[] = [];

  for (const item of storeItems) {
    // Step A: Create order
    const res = await fetch('/api/topup/purchase', {
      method: 'POST',
      body: JSON.stringify({
        store_id: parseInt(storeId),
        topup_product_id: item.product_id,
        quantity: item.quantity,
        ...
      })
    });
    
    const data = await res.json();
    
    // Step B: Fetch codes immediately
    const codesRes = await fetch(`/api/topup/order-codes/${data.order_id}`);
    const codesData = await codesRes.json();
    
    // Step C: حفظ الأكواد
    let itemCodes = [];
    if (Array.isArray(codesData)) {
      itemCodes = codesData;
    } else if (codesData.codes) {
      itemCodes = codesData.codes;
    }
    
    allCodes = [...allCodes, ...itemCodes];
    
    // Step D: إضافة للـ confirmations
    orderConfirmations.push({
      orderId: `${storeId}-${Date.now()}`,
      items: [item],
      codes: itemCodes  // ← الأكواد يتم حفظها هنا
    });
  }
  
  // Step E: عرض التأكيد
  setOrderConfirmation({
    type: 'topup',
    confirmations: orderConfirmations,  // ← يتم عرضها من هنا
    totalAmount: subtotal - discount
  });
};
```

---

### 2️⃣ عرض الأكواد في Confirmation

```tsx
// src/App.tsx: Line 1235-1305

if (orderConfirmation) {
  return (
    <div>
      {/* محتوى للأجهزة الصغيرة */}
      <div className="md:hidden">
        {orderConfirmation.confirmations.map((conf: any) =>
          conf.items.map((item: any) => {
            const availableCodes = conf.codes.slice(0, item.quantity);
            
            return (
              <div>
                <h3>{displayName}</h3>
                <p>الكمية: {item.quantity}</p>
                
                {availableCodes.length > 0 ? (
                  <div>
                    {availableCodes.map((code: string) =>
                      <div className="p-3 rounded-xl">{code}</div>
                    )}
                  </div>
                ) : (
                  <span>لا توجد أكواد متاحة</span>  // ← الرسالة الخاصة بك
                )}
              </div>
            );
          })
        )}
      </div>

      {/* جدول للأجهزة الكبيرة */}
      <div className="hidden md:block">
        <table>
          <thead>
            <tr>
              <th>اسم المنتج</th>
              <th>الكمية</th>
              <th>الأكواد</th>
            </tr>
          </thead>
          <tbody>
            {/* نفس المنطق... */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 3️⃣ Server Endpoint: POST /api/topup/purchase

```typescript
// server.ts: Line 5590-5911

app.post("/api/topup/purchase", async (req, res) => {
  try {
    const {
      store_id,
      topup_product_id,
      quantity,
      customer_id,
      phone,
      total_amount
    } = req.body;

    // ... [التحقق من العميل والائتمان] ...

    // ✅ إنشاء الطلب
    const orderResult = await pool.query(
      `INSERT INTO orders (
        customer_id, topup_customer_id, store_id, 
        total_amount, phone, status, is_topup_order
      ) VALUES ($1, $2, $3, $4, $5, 'completed', true)
      RETURNING id`,
      [null, foundCustomerId, parsedStoreId, total_amount, phone]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // ✅ إضافة order_item
    await pool.query(
      `INSERT INTO order_items (
        order_id, topup_product_id, quantity, price
      ) VALUES ($1, $2, $3, $4)`,
      [orderId, topup_product_id, quantity, total_amount / quantity]
    );
    
    // 🔑 جلب الأكواد من المنتج
    const productResult = await pool.query(
      `SELECT codes FROM topup_products WHERE id = $1`,
      [topup_product_id]
    );
    
    if (productResult.rows.length > 0) {
      const product = productResult.rows[0];
      let codesArray = product.codes;
      
      // تحويل إذا كانت نصية
      if (typeof codesArray === 'string') {
        codesArray = JSON.parse(codesArray);
      }
      
      if (Array.isArray(codesArray) && codesArray.length > 0) {
        // ❌ خذ الأكواد الأولى (هذا الجزء يحتوي على مشكلة)
        const usedCodes = codesArray.slice(0, quantity);
        const remainingCodes = codesArray.slice(quantity);
        
        // ❌ حذف الأكواد المستخدمة من المنتج
        await pool.query(
          `UPDATE topup_products 
           SET codes = $1, available_codes = $2 
           WHERE id = $3`,
          [remainingCodes, remainingCodes.length, topup_product_id]
        );
        
        console.log(`✅ Codes taken: ${usedCodes.length}`);
        console.log(`❌ Codes deleted from product!`);
      }
    }
    
    res.json({ success: true, order_id: orderId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 4️⃣ Server Endpoint: GET /api/topup/order-codes/:orderId

```typescript
// server.ts: Line 5935-5912

app.get("/api/topup/order-codes/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // جلب الطلب
    const orderResult = await pool.query(
      `SELECT id FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.json({ codes: [] });
    }
    
    // جلب order_items
    const itemsResult = await pool.query(
      `SELECT topup_product_id, quantity FROM order_items 
       WHERE order_id = $1`,
      [orderId]
    );
    
    // ❌ محاولة جلب الأكواد من المنتج (لكن تم حذفها!)
    let allCodes: string[] = [];
    for (const item of itemsResult.rows) {
      const productResult = await pool.query(
        `SELECT codes FROM topup_products WHERE id = $1`,
        [item.topup_product_id]
      );
      
      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        if (product.codes && Array.isArray(product.codes)) {
          // ❌ هنا نأخذ الأكواد الحالية (ليست الأكواد الأصلية!)
          const codesToAdd = product.codes.slice(0, item.quantity);
          allCodes = [...allCodes, ...codesToAdd];
        }
      }
    }
    
    res.json({
      order_id: orderId,
      codes: allCodes,  // ← قد تكون فارغة إذا المنتج انتهت أكواده
      count: allCodes.length
    });
    
  } catch (error) {
    res.json({ codes: [], error: error.message });
  }
});
```

---

## 🚨 المشكلة الأساسية

### السيناريو المشكل:

```
TIME 1: 14:00
├─ topup_products[95]: codes = [A, B, C, D, E, F, G, H, I, J]

TIME 2: 14:05 - الشراء الأول
├─ Customer 1 يشتري 3 أكواد
├─ Server:
│  ├─ يأخذ: [A, B, C]
│  ├─ يحفظ في order_items: topup_codes = [A, B, C] (لكن هذا العمود غير مستخدم!)
│  └─ يحذف من topup_products: codes = [D, E, F, G, H, I, J]  ❌
├─ Frontend:
│  ├─ GET /api/topup/order-codes/100
│  ├─ Server يأخذ: [D, E, F] (الأكواد الجديدة، ليست الأصلية!)
│  └─ Customer 1 يرى: D, E, F (خطأ!)

TIME 3: 14:10 - الشراء الثاني
├─ Customer 2 يشتري 4 أكواد
├─ Server:
│  ├─ يأخذ: [D, E, F, G]
│  └─ يحذف من topup_products: codes = [H, I, J]
├─ Frontend:
│  ├─ GET /api/topup/order-codes/101
│  └─ Customer 2 يرى: H, I, J (خطأ! كان يجب يرى D, E, F, G)

TIME 4: صباح اليوم التالي
├─ Customer 1 يذهب لـ /orders/100 لكي يرى الأكواd
├─ GET /api/topup/order-codes/100
├─ Server يرى الأكواد الحالية في المنتج: [H, I, J]
├─ يأخذ [H, I, J]
└─ Customer 1 يرى أكواد خاطئة! 😱
```

---

## ✅ الحل الصحيح

### خطة الإصلاح:

1. **عند الشراء**: احفظ الأكواد المسندة في جدول منفصل `order_codes`:

```sql
-- جدول جديد
CREATE TABLE order_codes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **عند الطلب**: ارجع الأكواد من الجدول الجديد:

```typescript
app.get("/api/topup/order-codes/:orderId", async (req, res) => {
  const codes = await pool.query(
    `SELECT code FROM order_codes WHERE order_id = $1`,
    [orderId]
  );
  res.json({
    order_id: orderId,
    codes: codes.rows.map(r => r.code)
  });
});
```

3. **عند الشراء**: احفظ في الجدول الجديد:

```typescript
// INSERT الأكواد المستخدمة
const usedCodes = codesArray.slice(0, quantity);
for (const code of usedCodes) {
  await pool.query(
    `INSERT INTO order_codes (order_id, code) VALUES ($1, $2)`,
    [orderId, code]
  );
}

// ثم احذف من topup_products
await pool.query(
  `UPDATE topup_products SET codes = $1 WHERE id = $2`,
  [remainingCodes, topup_product_id]
);
```

---

## 📚 ملخص الملفات والأسطر

| العمل | الملف | الأسطر |
|------|------|--------|
| عرض "لا توجد أكواد" | src/App.tsx | 1219, 1293 |
| جدول الأكواد | src/App.tsx | 1228-1305 |
| جمع الأكواد عند الشراء | src/App.tsx | 1070-1156 |
| عرض تفاصيل الطلب | src/App.tsx | 14162-14280 |
| إنشاء الطلب | server.ts | 5590-5911 |
| جلب الأكواد | server.ts | 5935-5912 |

---

## 🎯 النقاط الرئيسية

✅ **الأكواد تُعرض بنجاح في:**
- نافذة تأكيد الطلب (مباشرة بعد الشراء)
- صفحة تفاصيل الطلب (لاحقاً)

❌ **لكن هناك مشكلة:**
- الأكواد تُحفظ في `topup_products` فقط
- عند الشراء، يتم حذفها من `topup_products`
- عند جلبها لاحقاً، قد تكون أكواد مختلفة!

✅ **الحل:**
- حفظ الأكواد في جدول `order_codes` منفصل
- الاعتماد على هذا الجدول عند جلب الأكواد

