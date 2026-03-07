# 🚀 Supabase Quick Setup

## الخطوات السريعة

### 1️⃣ احصل على بيانات الاتصال من Supabase

```
Supabase Dashboard → Settings → Database → Connection String
```

ستحصل على:
```
postgresql://postgres:[PASSWORD]@api.supabase.co:5432/postgres
```

### 2️⃣ أنسخ SQL Schema

1. اذهب إلى: `Supabase SQL Editor`
2. انقر: `New Query`
3. انسخ محتوى: `supabase_schema.sql`
4. اضغط: `Run`

✅ جميع الجداول ستُنشأ تلقائياً

### 3️⃣ تحديث `.env`

استبدل:
```env
DATABASE_URL=postgresql://postgres:123@localhost:5432/multi_ecommerce
```

بـ:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@api.supabase.co:5432/postgres
```

### 4️⃣ اختبر الاتصال

```powershell
npm run dev
```

ثم افتح: `http://localhost:3000/api/stores`

يجب أن ترى بيانات من Supabase ✅

---

## 📊 Supabase الأساسية

| الميزة | التفاصيل |
|--------|----------|
| **Database** | PostgreSQL مُدار |
| **Storage** | 1 GB مجاني |
| **Auth** | مدمجة |
| **Real-time** | Subscriptions |
| **Functions** | Edge Functions |
| **Pricing** | مجاني للبداية |

---

## ⚠️ تذكيرات مهمة

1. **كلمة السر**: لا تشاركها في Git ❌
2. **متغيرات البيئة**: احفظها آمنة ✅
3. **HTTPS فقط**: عند النشر 🔒
4. **Backups**: فعّل النسخ الاحتياطية 💾

---

## 🔗 روابط مهمة

- Supabase Dashboard: https://supabase.com/dashboard
- SQL Editor: https://supabase.com/dashboard/sql
- Documentation: https://supabase.com/docs

---

**هل تحتاج مساعدة؟ اتصل بـ Support!** 📞
