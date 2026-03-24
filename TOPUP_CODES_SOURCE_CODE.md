# استخراج الكود الفعلي: عرض الأكواد في TopupStorefront

## 📋 جدول المراجع السريعة

| المكون | الملف | الأسطر | العنصر |
|-------|------|--------|--------|
| عرض "لا توجد أكواد" (Mobile) | src/App.tsx | 1217-1222 | رسالة خطأ |
| عرض "لا توجد أكواد" (Desktop) | src/App.tsx | 1290-1295 | رسالة خطأ |
| جدول الأكواد الكامل | src/App.tsx | 1226-1310 | صفحة تأكيد |
| جمع الأكواد من API | src/App.tsx | 1070-1090 | handleConfirmOrder |
| صفحة تفاصيل الطلب | src/App.tsx | 14166-14280 | TopupOrderDetails |
| إنشاء الطلب + أكواد | server.ts | 5590-5911 | POST /api/topup/purchase |
| جلب الأكواد من API | server.ts | 5935-5912 | GET /api/topup/order-codes |

---

## 1️⃣ الكود الفعلي: عرض الأكواد في نافذة التأكيد

### أ) عرض "لا توجد أكواد" للأجهزة الصغيرة (Mobile)

**الملف:** [src/App.tsx](src/App.tsx#L1215)  
**الأسطر:** 1215-1222

```typescript
{availableCodes.length > 0 ? (
  <div className="flex flex-col gap-2">
    {availableCodes.map((code: string, cIdx: number) => (
      <div key={cIdx} className={cn("px-3 py-2 rounded-xl font-mono text-sm text-center break-all", isDarkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900 border border-gray-200")}>
        {code}
      </div>
    ))}
  </div>
) : (
  <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>  // ✅ الرسالة
)}
```

---

### ب) جدول الأكواد الكامل (Desktop)

**الملف:** [src/App.tsx](src/App.tsx#L1228)  
**الأسطر:** 1228-1310

```typescript
{/* جدول المنتجات والأكواد */}
<div className={cn("hidden md:block rounded-lg border overflow-auto", isDarkMode ? "border-gray-700" : "border-gray-200")}>
  <table className="w-full">
    <thead>
      <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
        <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المنتج</th>
        <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الكمية</th>
        <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الأكواد</th>
      </tr>
    </thead>
    <tbody>
      {orderConfirmation.confirmations.map((conf: any, idx: number) => 
        conf.items.map((item: any, itemIdx: number) => {
          // الحصول على الأكواد والتأكد من أنها array
          let codes = conf.codes;
          if (!Array.isArray(codes)) {
            codes = [];
          }
          
          // الكمية المطلوبة
          const displayQuantity = item.quantity || 0;
          
          // الأكواد المتاحة حسب الكمية
          const availableCodes = codes.slice(0, displayQuantity);
          
          // بناء اسم المنتج - تأكد من عدم معاملة undefined
          let displayName = '';
          if (item.product_name && item.product_name !== 'undefined') {
            displayName = item.product_name;
          } else if (item.company_name && item.company_name !== 'undefined' && item.name) {
            displayName = `${item.company_name} - ${item.name}`;
          } else if (item.name) {
            displayName = item.name;
          } else {
            displayName = 'منتج بدون اسم';
          }
          
          console.log('🔍 Rendering item:', {
            product_name: item.product_name,
            company_name: item.company_name,
            name: item.name,
            displayName: displayName,
            quantity: displayQuantity,
            totalCodesAvailable: codes.length,
            availableCodesCount: availableCodes.length,
            codes: codes
          });
          
          return (
            <tr key={`${idx}-${itemIdx}`} className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
              <td className={cn("px-6 py-4 text-right align-top min-w-56", isDarkMode ? "text-gray-200 bg-gray-900/30" : "text-gray-800 bg-gray-50/30")}>
                <div className="font-normal text-sm break-words">{displayName}</div>
              </td>
              <td className={cn("px-6 py-4 text-center align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                <div className="font-semibold text-lg">{displayQuantity}</div>
              </td>
              <td className={cn("px-6 py-4 text-right align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                {availableCodes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {availableCodes.map((code: string, cIdx: number) => (
                      <div key={cIdx} className={cn("px-3 py-2 rounded font-mono text-sm text-center", isDarkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900")}>
                        {code}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>  // ✅ الرسالة في الجدول
                )}
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
```

---

## 2️⃣ الكود الفعلي: جمع الأكواد من handleConfirmOrder

**الملف:** [src/App.tsx](src/App.tsx#L1070)  
**الأسطر:** 1070-1090

```typescript
// Fetch topup codes for this order
let itemCodes: string[] = [];
try {
  const codesRes = await fetch(`/api/topup/order-codes/${data.order_id}`);
  const codesData = await codesRes.json();
  
  if (Array.isArray(codesData)) {
    itemCodes = codesData;
  } else if (codesData.codes && Array.isArray(codesData.codes)) {
    itemCodes = codesData.codes;
  } else if (codesData.data && Array.isArray(codesData.data)) {
    itemCodes = codesData.data;
  }
  
  console.log('📨 Fetched codes from API:', {
    orderId: data.order_id,
    codesCount: itemCodes.length
  });
} catch (err) {
  console.error('Failed to fetch topup codes:', err);
}

allCodes = [...allCodes, ...itemCodes];
confirmationItems.push({
  ...item,
  product_name: (item.product_name && item.product_name !== 'undefined') 
    ? item.product_name 
    : (item.name || 'منتج'),
  company_name: (item.company_name && item.company_name !== 'undefined') 
    ? item.company_name 
    : 'غير محدد'
});
```

---

## 3️⃣ الكود الفعلي: صفحة تفاصيل الطلب TopupOrderDetails

**الملف:** [src/App.tsx](src/App.tsx#L14162)  
**الأسطر:** 14162-14280

```typescript
const TopupOrderDetails = () => {
  const { storeId, orderId } = useParams();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Refresh customer debt when page loads
  const refreshCustomerDebt = async () => {
    try {
      const topupCustomer = localStorage.getItem('topupCustomer');
      if (!topupCustomer) return;
      
      const customer = JSON.parse(topupCustomer);
      if (!customer.customer_id) return;
      
      console.log('🔄 [TopupOrderDetails] Refreshing customer debt...');
      const response = await fetch(`/api/customers/${customer.customer_id}/statement`);
      
      if (response.ok) {
        const transactions = await response.json();
        
        // Calculate final balance from transactions
        let finalBalance = 0;
        if (Array.isArray(transactions)) {
          const lastTransaction = transactions[transactions.length - 1];
          if (lastTransaction) {
            finalBalance = Number(lastTransaction.balance) || 0;
          }
        }
        
        console.log('📊 [TopupOrderDetails] Updated debt:', finalBalance);
        
        // Update customer with new debt
        const updatedCustomer = {
          ...customer,
          current_debt: finalBalance
        };
        localStorage.setItem('topupCustomer', JSON.stringify(updatedCustomer));
        console.log('✅ [TopupOrderDetails] Customer debt saved to localStorage');
      }
    } catch (err) {
      console.error('[TopupOrderDetails] Error refreshing debt:', err);
    }
  };

  useEffect(() => {
    // Refresh customer debt when page loads
    refreshCustomerDebt();
    
    // ✅ Fetch order codes
    fetch(`/api/topup/order-codes/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setCodes(data.codes);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading codes:', error);
        setLoading(false);
      });
  }, [orderId]);

  const copyAllCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-4 sm:p-8 text-center">جاري تحميل أكوادك...</div>;

  return (
    <div className={cn("min-h-screen p-4 sm:p-8", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal mb-2">شكراً لك! 🎉</h1>
          <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-600")}>تم استلام طلبك بنجاح</p>
        </div>

        <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50")}>
          <div className={cn("p-6 border-b border-green-500", isDarkMode ? "border-green-900" : "")}>
            <h2 className="font-normal text-lg text-green-600">أكوادك الخاصة</h2>
            <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>احفظ هذه الأكواد في مكان آمن</p>
          </div>

          <div className="p-6 space-y-3">
            {/* ✅ عرض جميع الأكواد */}
            {codes.map((code, idx) => (
              <div key={idx} className={cn("p-4 rounded-lg border-2 font-mono text-lg font-normal", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}>
                {code}
              </div>
            ))}
          </div>

          <div className={cn("p-4 border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
            <button
              onClick={copyAllCodes}
              className="w-full py-3 rounded-lg font-normal transition-all"
            >
              {copied ? '✅ تم النسخ!' : '📋 نسخ الأكواد'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
```

---

## 4️⃣ الكود الفعلي: Server API - POST /api/topup/purchase

**الملف:** [server.ts](server.ts#L5590)  
**الأسطر:** 5782-5819 (استخراج الأكواد)

```typescript
// Get current product codes/images and remove used ones
const productResult = await pool.query(
  `SELECT codes, images FROM topup_products WHERE id = $1`,
  [topup_product_id]
);

if (productResult.rows.length > 0) {
  const product = productResult.rows[0];
  let codesArray = product.codes;
  let imagesArray = product.images || [];
  
  // PostgreSQL TEXT[] returns as array, but handle edge cases
  if (typeof codesArray === 'string') {
    try {
      codesArray = JSON.parse(codesArray);
    } catch (e) {
      codesArray = [];
    }
  }
  
  if (typeof imagesArray === 'string') {
    try {
      imagesArray = JSON.parse(imagesArray);
    } catch (e) {
      imagesArray = [];
    }
  }
  
  // Ensure it's an array
  if (!Array.isArray(codesArray)) {
    codesArray = [];
  }
  if (!Array.isArray(imagesArray)) {
    imagesArray = [];
  }
  
  console.log(`🔑 Current codes available: ${codesArray.length}`);
  console.log(`🖼️  Current images available: ${imagesArray.length}`);
  
  if (codesArray.length > 0) {
    // ✅ خذ الأكواد المطلوبة
    const usedCodes = codesArray.slice(0, quantity);
    const remainingCodes = codesArray.slice(quantity);
    console.log(`🗑️  Removed ${quantity} codes. Remaining: ${remainingCodes.length}`);
    
    // ❌ حذف الأكواد المستخدمة من المنتج
    await pool.query(
      `UPDATE topup_products SET codes = $1, available_codes = $2 WHERE id = $3`,
      [remainingCodes, remainingCodes.length, topup_product_id]
    );
    
    console.log(`✅ Topup product codes updated - available_codes: ${remainingCodes.length}`);
  } else {
    console.log(`⚠️  Warning: No codes available to assign!`);
  }
  
  // Handle images...
}
```

---

## 5️⃣ الكود الفعلي: Server API - GET /api/topup/order-codes/:orderId

**الملف:** [server.ts](server.ts#L5935)  
**الأسطر:** 5935-5912

```typescript
// ✅ Get order codes after purchase (legacy - still supported)
app.get("/api/topup/order-codes/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // جلب بيانات الطلب
    const orderResult = await pool.query(
      `SELECT id, store_id, status FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Topup order not found" });
    }

    const order = orderResult.rows[0];

    // جلب المنتجات المطلوبة في الطلب من جدول order_items
    const itemsResult = await pool.query(
      `SELECT topup_product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    if (itemsResult.rows.length === 0) {
      return res.status(400).json({ error: "No items found for this order", codes: [] });
    }

    // ❌ جلب الأكواد لكل منتج في الطلب (من الحقل الذي تم تعديله)
    let allCodes: string[] = [];
    for (const item of itemsResult.rows) {
      const productResult = await pool.query(
        `SELECT codes FROM topup_products WHERE id = $1`,
        [item.topup_product_id]
      );

      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        if (product.codes && Array.isArray(product.codes)) {
          // ❌ خذ أول X أكواد حسب الكمية المطلوبة
          // ⚠️ لكن هذه قد تكون أكواد جديدة بعد تحديث الكمية!
          const codesToAdd = product.codes.slice(0, item.quantity);
          allCodes = [...allCodes, ...codesToAdd];
        }
      }
    }

    res.json({
      order_id: orderId,
      store_id: order.store_id,
      status: order.status,
      codes: allCodes,
      count: allCodes.length
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});
```

---

## 📊 مثال عملي: Request/Response

### Request 1: إنشاء طلب

```bash
POST /api/topup/purchase
Content-Type: application/json

{
  "store_id": 13,
  "topup_product_id": 95,
  "quantity": 2,
  "customer_id": null,
  "customer_type": "cash",
  "phone": "07810909000",
  "total_amount": 75000
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 142,
  "message": "✓ تم إتمام الشراء بنجاح"
}
```

---

### Request 2: جلب الأكواد

```bash
GET /api/topup/order-codes/142
```

**Response:**
```json
{
  "order_id": 142,
  "store_id": 13,
  "status": "completed",
  "codes": [
    "XY1234567890",
    "AB9876543210"
  ],
  "count": 2
}
```

---

### Request 3: في صفحة تفاصيل الطلب

```javascript
// في TopupOrderDetails component
useEffect(() => {
  fetch(`/api/topup/order-codes/${orderId}`)
    .then(r => r.json())
    .then(data => {
      setCodes(data.codes);  // ["XY1234567890", "AB9876543210"]
      setLoading(false);
    });
}, [orderId]);
```

---

## 🔗 روابط مباشرة للملفات

- ✅ عرض "لا توجد أكواد": [src/App.tsx#L1219](src/App.tsx#L1219)
- ✅ جدول الأكواد: [src/App.tsx#L1228](src/App.tsx#L1228)
- ✅ جمع الأكواد: [src/App.tsx#L1070](src/App.tsx#L1070)
- ✅ التفاصيل: [src/App.tsx#L14162](src/App.tsx#L14162)
- ✅ API Create: [server.ts#L5590](server.ts#L5590)
- ✅ API Fetch: [server.ts#L5935](server.ts#L5935)

