# 🖼️ IMAGE UPLOAD SYSTEM - QUICK START

## ✅ What's Ready NOW

### Scenario 1: Use Local Storage (Recommended for now)
```
✅ Images save to /uploads/topup/store-X/product-Y/
✅ URLs stored in database
✅ Works immediately - NO SETUP NEEDED
```

### Scenario 2: Use Firebase (Optional)
```
🔄 Requires Firebase account + credentials
🔄 Then run: node setup_firebase.mjs
🔄 System auto-switches to Firebase
```

---

## 🚀 START USING IT NOW

### Step 1: Create Product
```bash
POST http://localhost:3000/api/topup/products
{
  "store_id": 1,
  "company_id": 5,    # Select tariff company
  "amount": 35000,    # Recharge amount
  "price": 40000      # Your price
}
```

### Step 2: Add Images
```bash
POST http://localhost:3000/api/topup/upload-images-firebase
{
  "store_id": 1,
  "topup_product_id": 123,        # From Step 1 response
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgs..."
  ]
}
```

### Response
```json
{
  "success": true,
  "image_urls": [
    "/uploads/topup/store-1/product-123/image-123-abc.jpg"
  ]
}
```

---

## 🔥 Later: Switch to Firebase (5 min)

```bash
# 1. Get Firebase service account JSON from:
#    Firebase Console → Project Settings → Service Accounts
#    → Generate New Private Key

# 2. Run setup
node setup_firebase.mjs

# 3. Paste path to JSON file when prompted

# 4. Restart server
npm start

# Done! System now uses Firebase
```

---

## 📁 What Files Changed

| File | Purpose |
|------|---------|
| `src/lib/imageUpload.ts` | Upload logic (Firebase + Local) |
| `.env.example` | Firebase config template |
| `setup_firebase.mjs` | Automatic setup script |
| `IMAGE_UPLOAD_GUIDE.md` | Full documentation |
| `IMAGE_SYSTEM_CONFIG.md` | Configuration summary |

---

## 📊 System Features

- ✅ **Local Storage** - Works now, no setup
- ✅ **Firebase** - Optional, automatic setup
- ✅ **Duplicates** - Auto-detected via MD5
- ✅ **Security** - Signed URLs (Firebase) + server auth (Local)
- ✅ **Database** - URLs saved in `topup_products.images`

---

## 🎯 Database Schema New

### Added Column
```sql
ALTER TABLE topup_products 
ADD COLUMN category_id INTEGER;  -- Already added ✅
```

### Image Metadata Table (Already exists)
```sql
topup_product_images:
- id
- store_id
- product_id
- image_url        ← Gets stored here
- image_hash       ← For duplicate detection
- uploaded_at
```

---

## ✨ Key Benefits

| Benefit | Local | Firebase |
|---------|-------|----------|
| Works now | ✅ | ⏳ (After setup) |
| No server disk needed | ❌ | ✅ |
| Global CDN | ❌ | ✅ |
| Auto-scaling | ❌ | ✅ |
| Free tier | ✅ | ✅ |
| Setup time | 0 min | 5 min |

---

## 🚨 Current Limitations

### Local Storage
- Limited by server disk space
- Single region (your server)
- Manual backup needed

### Workaround
- Start with Local Storage now
- Switch to Firebase later
- Same API - no code changes needed!

---

## 🎉 Ready to Use!

Your system now:

✅ Saves images with proper URLs  
✅ Stores URLs in database  
✅ Detects duplicate images  
✅ Can switch to Firebase anytime  
✅ Works in development AND production  

**No more hardcoded paths!**

---

## 📚 For More Info

- 📖 `IMAGE_UPLOAD_GUIDE.md` - Full guide
- ⚙️ `IMAGE_SYSTEM_CONFIG.md` - Configuration
- 🔧 `setup_firebase.mjs` - Setup script

---

**Status**: ✅ READY TO USE  
**Date**: March 18, 2026
