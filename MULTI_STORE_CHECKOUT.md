# نظام الشراء متعدد المتاجر

## الحالة الحالية ✅

النظام الحالي **يدعم بالفعل** الشراء من عدة متاجر في سلة واحدة:

### 1. تجميع المنتجات حسب المتجر
```typescript
const itemsByStore = enrichedItems.reduce((acc: any, item) => {
  const storeId = item.store_id;
  if (!acc[storeId]) {
    acc[storeId] = {
      items: [],
      store_type: item.store_type || 'regular'
    };
  }
  acc[storeId].items.push(item);
  return acc;
}, {});
```

### 2. إنشاء طلب منفصل لكل متجر
```typescript
for (const storeId of Object.keys(itemsByStore)) {
  const storeInfo = itemsByStore[storeId];
  const storeItems = storeInfo.items;
  const storeType = storeInfo.store_type;
  
  if (storeType === 'topup') {
    // طلب متجر شحن (Topup Store)
    // إرسال إلى /api/topup/purchase
  } else {
    // طلب متجر عادي (Regular Store)
    // إرسال إلى /api/orders
  }
}
```

### 3. توزيع الخصم على المتاجر
```typescript
const storeDiscount = totalStoreAmount > 0 
  ? (storeAmount / totalStoreAmount) * discount 
  : 0;
```

## الشروط الأساسية ⚠️

لكي يعمل نظام متعدد المتاجر بشكل صحيح، يجب أن يحتوي **كل منتج** على:

```typescript
{
  id: number,
  name: string,
  price: number,
  store_id: number,           // ✅ مهم جداً! معرف المتجر
  store_name: string,         // ✅ مهم جداً! اسم المتجر
  store_type: 'regular' | 'topup',  // ✅ نوع المتجر
  quantity: number
}
```

## المشاكل المحتملة 🔍

### 1. المنتجات قد لا تحمل `store_id` من الـ API
**الحل**: يجب تأكد أن `/api/products` يرجع المنتجات مع `store_id`

### 2. عند الحصول على البيانات من عدة متاجر، قد تنقص البيانات
**الحل**: التأكد من تحميل كل بيانات المنتج الكاملة قبل الإضافة للسلة

### 3. المتاجر غير مرتبطة بشكل صحيح
**الحل**: التأكد من وجود علاقة صحيحة بين:
- `products.store_id` ← `stores.id`
- `topup_products.store_id` ← `stores.id`

## الخطوات التالية 📋

1. **التحقق من API Response**:
   - تأكد أن `/api/products` يرجع مع كل منتج:
     - `store_id`
     - `store_name`
     - `store_type`

2. **تحسين إثراء البيانات**:
   ```typescript
   // عند إضافة منتج إلى السلة، تأكد من:
   addItem({
     ...product,
     store_id: product.store_id,        // ✅
     store_name: product.store_name,    // ✅
     store_type: product.store_type,    // ✅
   });
   ```

3. **اختبار متعدد المتاجر**:
   - أضف منتجات من متجرين مختلفين
   - اختبر الدفع والتأكد من إنشاء طلبات منفصلة

## الملفات المتعلقة 📁

- `src/App.tsx:667` - دالة `handleCheckout`
- `src/App.tsx:750` - دالة `handleConfirmOrder` 
- `src/App.tsx:760` - تجميع المنتجات حسب المتجر
