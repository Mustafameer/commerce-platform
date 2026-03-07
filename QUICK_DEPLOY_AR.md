# 🚀 خطوات النشر السريعة

## **المرحلة الأولى: تحضيرات GitHub** ✅

1. **Push الكود إلى GitHub**
```powershell
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## **المرحلة الثانية: نشر Backend على Railway** 🔌

### 1. إنشاء حساب
- اذهب: [Railway.app](https://railway.app)
- اضغط **Login with GitHub**

### 2. Deploy المشروع
1. اضغط **New Project**
2. اختر **Deploy from GitHub**
3. اختر **commerce-platform**
4. اضغط **Deploy**

### 3. إضافة PostgreSQL
1. في Dashboard، اضغط **Add Service**
2. اختر **PostgreSQL**
3. انتظر الإنشاء

### 4. متغيرات البيئة
اضغط على service → **Variables** → أضف:
```
ENVIRONMENT=production
NODE_ENV=production
VERCEL_URL=your-vercel-domain.vercel.app
```

### ✅ Backend جاهز على:
```
https://commerce-platform-xxxx.railway.app
```

---

## **المرحلة الثالثة: نشر Frontend على Vercel** 🌐

### 1. إنشاء حساب
- اذهب: [Vercel.com](https://vercel.com)
- اضغط **Sign Up with GitHub**

### 2. Import المشروع
1. اضغط **Add New** → **Project**
2. اختر **Import Git Repository**
3. اختر **commerce-platform**
4. اضغط **Import**

### 3. متغيرات البيئة
في Project Settings → **Environment Variables**:
```
VITE_API_URL=https://commerce-platform-xxxx.railway.app
```

### 4. Deploy
اضغط **Deploy** وانتظر الانتهاء

### ✅ Frontend جاهز على:
```
https://your-project.vercel.app
```

---

## **المرحلة الرابعة: ربط الروابط** 🔗

### في Vercel Environment:
```
VITE_API_URL=https://commerce-platform-xxxx.railway.app
```

### في Railway Environment:
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
VERCEL_URL=your-vercel-domain.vercel.app
```

---

## **الروابط النهائية:**

| الجزء | الرابط | من يستخدمه |
|------|--------|-----------|
| **Frontend** | `https://your-project.vercel.app` | الآدمن، التاجر، المشتري |
| **API** | `https://commerce-platform-xxxx.railway.app` | البيانات والخوادم |

---

## **✅ قائمة التحقق النهائية:**

- [ ] Push الكود على GitHub
- [ ] Railway Deploy اكتمل
- [ ] PostgreSQL متصل مع Railway
- [ ] Vercel Deploy اكتمل
- [ ] متغيرات البيئة صحيحة
- [ ] اختبار الروابط تعمل
- [ ] Database migrations نجحت
- [ ] API endpoints ترد البيانات

---

## **⚠️ تعليمات مهمة:**

1. **Database Backup** - احفظ بيانات database محلياً قبل النشر
2. **SMTP Config** - أضف بيانات Gmail SMTP الفعلية في Railway
3. **Testing** - اختبر كل صفحة قبل الإطلاق
4. **Monitoring** - راقب Railway logs للأخطاء

---

**هل تريد مساعدة في أي خطوة؟** 🤔
