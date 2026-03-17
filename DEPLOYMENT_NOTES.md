# Deployment and Build Notes

## Build Cache Issue with Railway

### Problem
When Railway performs automatic builds from GitHub webhooks, it shows warnings (currently 10). However, when performing a manual redeploy from the Railway dashboard, all warnings disappear.

### Root Cause
Railway's nixpacks builder maintains a build cache between automated deployments. This cache can retain artifacts from previous builds. When a manual redeploy is triggered from Railway's dashboard, it creates a fresh build environment without using the cache.

### Solution
**Use Manual Redeploy**: For clean builds without cache artifacts, trigger redeploys manually from Railway's dashboard instead of relying on automatic builds from GitHub pushes.

**Steps:**
1. Go to Railway Dashboard
2. Open the `web` project
3. Click on the `web-production` service
4. Find the "Deployments" section
5. Click the redeploy button (⟲ icon)

This ensures:
- Fresh build environment
- No cached artifacts
- Clean environment variables
- No lingering build warnings

### Automated Builds
To disable automatic builds from GitHub and use manual redeploys only:
1. Railway Dashboard → Projects → Settings
2. Find "GitHub" or "Git"
3. Disable "Automatic Deployments" if manual control is preferred

## Security Notes

### Credentials Handling
- ✅ All hardcoded database credentials have been removed
- ✅ Diagnostic scripts with credentials have been removed from git tracking
- ✅ `.env` file is in `.gitignore`
- ✅ Database connection uses `process.env.DATABASE_URL` in production
- ✅ Explicit validation throws errors if required environment variables are missing

### Files to Never Commit
The following file patterns are ignored in `.gitignore`:
- `check_*.{cjs,mjs,ts,js}` - Diagnostic check scripts
- `add_*.{cjs,mjs,ts,js}` - Database setup scripts
- `test_*.{cjs,mjs,ts,js}` - Test scripts
- `analyze_*.{cjs,mjs,ts,js}` - Analysis scripts
- `backup_*.{cjs,mjs,ts,js}` - Backup scripts
- `*_diagnostic.*` - Diagnostic scripts
- `.env` and `.env.local` - Local environment files
- `*.pem`, `*.key` - SSL certificates and private keys

## Production Environment Requirements

Railway automatically sets the following environment variable:
- `DATABASE_URL` - PostgreSQL connection string (set by Railway PostgreSQL plugin)

The application will **fail to start** in production if `DATABASE_URL` is not set.

### Local Development
For local development, set `DATABASE_URL`:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/database"
npm run dev
```

Or add to `.env` (NOT tracked in git):
```
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

## Build Process

### Production Build
```bash
npm install && npm run build && NODE_ENV=production tsx server.ts
```

### Build Configuration (railway.json)
- Builder: `nixpacks` (containerless Node.js builder)
- Build Command: `npm install && npm run build`
- Start Command: `npm start` (which runs the above production build)
- Replicas: 1

## Troubleshooting

### Issue: Application fails to start
**Cause**: `DATABASE_URL` environment variable not set
**Solution**: 
1. Go to Railway Dashboard
2. Projects → commerce-platform → web → Variables
3. Ensure `DATABASE_URL` is set to Railway PostgreSQL connection string

### Issue: Build succeeds but warnings persist
**Cause**: Build cache containing old warnings
**Solution**: 
1. Use manual redeploy from Railway dashboard (not git push)
2. Or wait for Railway to clear cache automatically

### Issue: Changes not reflected in production
**Cause**: Build cache or browser cache
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Trigger manual redeploy from Railway
3. Check Railway logs: Dashboard → Projects → Deployments

## References
- Railway Documentation: https://railway.app/docs
- Nixpacks: https://nixpacks.com
