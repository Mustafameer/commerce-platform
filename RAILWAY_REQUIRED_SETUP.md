# ⚡ Railway Setup - REQUIRED for Production

## 🚨 CRITICAL: Your deployment will FAIL without these steps!

The application requires **Railway PostgreSQL** to be configured. It will NOT run without it.

---

## ✅ Step-by-Step Setup

### 1️⃣ Add PostgreSQL Plugin to Railway

```
1. Go to: https://railway.app/project/YOUR_PROJECT_ID
2. Click "Plugins" button
3. Search for "PostgreSQL"
4. Click "Install" → Railway creates a new PostgreSQL database
5. Railway automatically sets DATABASE_URL environment variable ✅
```

### 2️⃣ Verify DATABASE_URL is Set

```
In Railway Dashboard:
1. Go to your Web Service
2. Go to "Variables" tab
3. You should see DATABASE_URL like:
   postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

If DATABASE_URL is NOT there:
- Delete the PostgreSQL plugin
- Re-add it fresh

### 3️⃣ Deploy to Railway

#### Option A: GitHub Integration (Auto-Deploy)
```bash
git push origin main
# Railway auto-detects changes and deploys
```

#### Option B: Railway CLI (Manual Deploy)
```bash
npm install -g @railway/cli
railway login
railway up
```

---

## ❌ Common Errors & Fixes

### Error: "DATABASE_URL not set"
**Cause:** PostgreSQL not added to Railway
**Fix:**
- Add PostgreSQL plugin (see Step 1 above)
- Wait 2-3 minutes for Railway to initialize
- Redeploy

### Error: "ECONNREFUSED localhost:5432"
**Cause:** Application trying to connect to local database
**Fix:**
- This means DATABASE_URL is not set properly
- Verify it in Railway Variables tab
- Check if PostgreSQL plugin is installed

### Error: "Connection refused" during deploy
**Cause:** Database not ready when app starts
**Fix:**
- Railway might still be initializing PostgreSQL
- Wait 2-3 minutes
- Click "Redeploy" button in Railway dashboard

---

## 📋 Deployment Checklist

Before deploying:

- [ ] PostgreSQL plugin installed in Railway
- [ ] DATABASE_URL visible in Variables tab
- [ ] NODE_ENV set to "production"
- [ ] VITE_API_URL points to railway.app domain
- [ ] No .env file in repository (git ignored)

After deploying:

- [ ] Check logs in Railway dashboard for "✅ All required environment variables are set"
- [ ] Check for "✅ [SERVER] Using cloud DATABASE_URL"
- [ ] No "❌ DATABASE_URL not set" errors

---

## 🔗 Resources

- [Railway PostgreSQL Docs](https://docs.railway.app/plugins/postgresql)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway Dashboard](https://railway.app)

---

## 💡 Quick Test

After deployment, make a test request:

```bash
# Replace with your Railway domain
curl https://your-app.up.railway.app/api/test-db

# Should show:
# {"message":"✅ Database connected","timestamp":"2026-03-24T..."}
```

---

**⚠️ This setup is REQUIRED for the application to work in production.**

If you skip this, the application will:
1. Start building ✅
2. Fail on startup with DATABASE_URL error ❌
3. Not serve the application

**Please follow these steps before deploying!**
