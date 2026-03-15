# 🚂 نشر على Railway

## خطوات النشر:

### 1. الإعداد الأولي
```bash
npm install -g @railway/cli
railway login
```

### 2. ربط المشروع والبيانات
```bash
railway init
```

اختر:
- ❌ "Create a new project" (إذا أنشأت مشروع جديد)
- ✅ "Add services to existing project" (إذا كان لديك مشروع)

### 3. إضافة PostgreSQL
```bash
railway add
# اختر PostgreSQL
```

### 4. تعيين المتغيرات
بعد إضافة PostgreSQL، Railway سيعطيك `DATABASE_URL` تلقائياً في المتغيرات.

### 5. النشر
```bash
git add .
git commit -m "Setup Railway deployment"
git push origin main
```

أو نشر محلي:
```bash
railway up
```

## متغيرات البيئة المطلوبة:

```
DATABASE_URL=postgresql://...  (يتم تعيينها تلقائياً من PostgreSQL plugin)
PORT=3000  (اختياري - Railway سيعطيك port)
NODE_ENV=production
TELEGRAM_BOT_TOKEN=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

## التحقق من الحالة:

```bash
railway status
railway log
railway shell
```

## الروابط المفيدة:

- 🔗 [Railway Dashboard](https://railway.app)
- 📖 [Railway Docs](https://docs.railway.app)
- 🐘 [PostgreSQL on Railway](https://docs.railway.app/plugins/postgresql)

## ملاحظات:

- الملف `railway.json` يحتوي على إعدادات البناء
- الملف `.railwayignore` يسّرع عملية البناء بتجاهل ملفات غير ضرورية
- الـ `start` script في `package.json`:
  ```bash
  npm run build && NODE_ENV=production tsx server.ts
  ```
  - يبني الـ React frontend (Vite)
  - يشغل الـ Express server مع TypeScript على الفور

## استكشاف الأخطاء:

إذا واجهت مشاكل:

1. **فحص السجلات:**
   ```bash
   railway log
   ```

2. **الاتصال بقاعدة البيانات:**
   ```bash
   railway shell
   psql $DATABASE_URL
   ```

3. **البيئة:**
   ```bash
   railway env
   ```
