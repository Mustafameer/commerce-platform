# 🚀 تعليمات النشر - Commerce Platform

## **الخطوة 1️⃣: نشر Backend على Railway**

### 1. إنشاء حساب Railway
1. اذهب إلى [Railway.app](https://railway.app)
2. اضغط **Login with GitHub** (أو طريقة أخرى)

### 2. نشر المشروع
1. في لوحة التحكم، اضغط **New Project**
2. اختر **Deploy from GitHub**
3. اختر **commerce-platform** repository
4. اضغط **Deploy**

### 3. إضافة قاعدة البيانات
1. في Railway، اضغط **Add Service**
2. اختر **PostgreSQL**
3. سيُنشئ database جديدة تلقائياً

### 4. تعيين متغيرات البيئة
في Railway Dashboard:
1. اضغط على **commerce-platform** service
2. اذهب إلى **Variables**
3. أضف:
   ```
   DATABASE_URL = (سيكون موجود تلقائياً من PostgreSQL)
   PORT = 3000
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your-email@gmail.com
   SMTP_PASS = your-app-password
   SMTP_FROM = "Multi Commerce Platform <your-email@gmail.com>"
   ```

### 5. تشغيل الروابط
- Backend سيكون متاح على: `https://commerce-platform-xxxx.railway.app`

---

## **الخطوة 2️⃣: نشر Frontend على Vercel**

### 1. إنشاء حساب Vercel
1. اذهب إلى [Vercel.com](https://vercel.com)
2. اضغط **Sign Up with GitHub**

### 2. نشر المشروع
1. اضغط **Import Project**
2. اختر **GitHub** 
3. اختر repository: **commerce-platform**
4. اضغط **Import**

### 3. تعيين متغيرات البيئة
في Vercel:
1. Go to **Settings**
2. اختر **Environment Variables**
3. أضف:
   ```
   VITE_API_URL = https://commerce-platform-xxxx.railway.app
   ```

### 4. تشغيل الروابط
- اضغط **Deploy**
- Frontend سيكون متاح على: `https://your-project.vercel.app`

---

## **الخطوة 3️⃣: ربط API في Frontend**

في ملف `src/App.tsx` (أو أي ملف يستخدم API):

```typescript
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// استخدم API_URL في جميع الـ fetch calls
```

---

## **الخطوة 4️⃣: تفعيل CORS على Backend**

في `server.ts`، تأكد من أن CORS مفعل:

```typescript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

## **✅ الروابط النهائية:**

بعد الانتهاء من جميع الخطوات:

🌐 **Frontend (عميل/تاجر/آدمن):**
```
https://your-project.vercel.app
```

🔌 **Backend API:**
```
https://commerce-platform-xxxx.railway.app
```

---

## **🎯 الخطوات السريعة:**

1. ✅ Push الكود إلى GitHub
2. ✅ Connect Railway إلى GitHub
3. ✅ Connect Vercel إلى GitHub
4. ✅ اضبط متغيرات البيئة
5. ✅ اضغط Deploy
6. ✅ تخلص! 🎉

---

## **⚠️ ملاحظات مهمة:**

- تأكد من أن `.env` محدث بـ production URLs
- لا تنسى إضافة `CORS` headers على Backend
- اختبر الـ API مع Postman قبل الدخول
- تأكد من مشاركة SMTP credentials آمنة

---

**أي مشاكل؟ تواصل معي!** 🤝
