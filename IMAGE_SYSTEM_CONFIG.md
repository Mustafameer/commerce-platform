# 🎯 Image Upload System - Configuration Summary

## ✅ Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Local Image Storage** | ✅ Ready | `/uploads` directory |
| **Firebase Optional** | 📋 Available | Requires setup |
| **Database URLs** | ✅ Saved | In `topup_products.images` array |
| **Duplicate Detection** | ✅ Enabled | MD5 hash comparison |
| **Signed URLs** | ✅ Auto | Firebase generates for 100 years |

---

## 🚀 ONE-MINUTE SETUP

### Current (Working Now)
```
Images are saved to: /uploads/topup/store-X/product-Y/image-*.jpg
URLs stored in: topup_products.images array
Status: ✅ Ready to use
```

### Optional Firebase Setup
```bash
# 1. Get Firebase service account JSON
#    Go to: Firebase Console → Project Settings → Service Accounts
#    Click: "Generate New Private Key"

# 2. Run setup script
node setup_firebase.mjs

# 3. Select your service account JSON file

# 4. Restart server
npm start

# 5. Done! System automatically uses Firebase
```

---

## 📁 File Structure

```
commerce-platform/
├── uploads/                          ← Images saved here (local)
│   └── topup/
│       └── store-1/
│           └── product-123/
│               ├── image-1-abc.jpg
│               ├── image-2-def.jpg
│               └── image-3-ghi.jpg
├── src/
│   └── lib/
│       └── imageUpload.ts           ← Upload logic
├── server.ts                         ← API endpoints
├── setup_firebase.mjs               ← Setup helper
├── IMAGE_UPLOAD_GUIDE.md            ← Full documentation
└── .env                             ← Configuration
```

---

## 🔄 Image Flow

```
Frontend (Base64)
    ↓
POST /api/topup/upload-images-firebase
    ↓
Server: Convert Base64 → Buffer
    ↓
Generate MD5 Hash (for duplicates)
    ↓
┌─────────────────┐
│  Firebase or    │
│ Local Storage?  │
└────┬────┬───────┘
     │    │
     │Local (Default)
     │    │
     │    → Save to /uploads/
     │    → Get URL
     │
     Firebase (Optional)
     │
     → Upload to Firebase Storage  
     → Get Signed URL
     │
     └─→ Same: Save URL to database
         Return to frontend
```

---

## 💾 Storage Comparison

### Local Storage
```
📁 Location: /uploads/topup/store-1/product-5/
🔗 URL: /uploads/topup/store-1/product-5/image-1.jpg
⚡ Speed: Fast (local)
🌍 Scalability: Limited by disk space
🔐 Security: Server-dependent
```

### Firebase Storage
```
☁️ Location: Firebase Cloud
🔗 URL: https://firestore-url/...?token=...
⚡ Speed: CDN (global)
🌍 Scalability: Unlimited
🔐 Security: Google-managed + signed URLs
```

---

## 🛠️ API Summary

```bash
# 1. Create product (without images)
POST /api/topup/products
{
  "store_id": 1,
  "company_id": 5,
  "amount": 35000,
  "price": 40000
}

# 2. Add images afterward
POST /api/topup/upload-images-firebase
{
  "store_id": 1,
  "topup_product_id": 123,
  "images": ["data:image/jpeg;base64,..."]
}

# Response includes image URLs ✅
```

---

## 📊 Database

### Images Array in Product
```sql
-- Product has images array
SELECT id, images FROM topup_products WHERE id = 123;

-- Result:
images: [
  "/uploads/topup/store-1/product-123/image-1.jpg",
  "/uploads/topup/store-1/product-123/image-2.jpg"
]
```

### Image Metadata Table
```sql
-- Image metadata stored separately
SELECT * FROM topup_product_images 
WHERE product_id = 123;

-- Includes:
- image_url
- image_hash (for duplicate detection)
- uploaded_at
```

---

## 🎨 Configuration Options

### .env Variables
```env
# All optional - system works without these
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN..."
FIREBASE_CLIENT_EMAIL=...@iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### How System Detects Storage
```javascript
if (FIREBASE env vars present) {
  ✅ Use Firebase Storage
} else {
  ✅ Use Local Storage (default)
}
```

---

## ✨ Features

### ✅ Implemented
- [x] Local file storage
- [x] Firebase integration (optional)
- [x] Automatic backend detection
- [x] MD5 duplicate detection
- [x] Signed URL generation
- [x] URL storage in database
- [x] Image metadata tracking
- [x] Setup helper script

### 📋 Optional Enhancements
- [ ] Image compression before upload
- [ ] Image cropping in frontend
- [ ] Watermark support
- [ ] Thumbnail generation
- [ ] Image CDN caching headers

---

## 🚨 Important Notes

### Security
- ✅ Signed URLs expire after 100 years (effectively permanent)
- ✅ Firebase Storage rules enforce access control
- ✅ Local files served through Express (can add auth)

### Performance
- ✅ Base64 images can be large (compress first)
- ✅ Firebase CDN auto-optimizes delivery
- ✅ Local storage bounded by server disk

### Scalability
- ✅ Local: Limited to server disk (~100GB typical)
- ✅ Firebase: Unlimited, pay-per-usage model

---

## 🐛 Quick Debugging

```bash
# Check if images exist locally
ls -la uploads/topup/

# View database images
psql -d multi_ecommerce -c \
  "SELECT id, array_length(images, 1) FROM topup_products"

# Check Firebase credentials
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_STORAGE_BUCKET

# View image metadata
psql -d multi_ecommerce -c \
  "SELECT image_url, image_hash FROM topup_product_images LIMIT 5"
```

---

## 📞 Support

| Issue | Solution |
|-------|----------|
| Images not saving | Check `/uploads` exists |
| Firebase not working | Run `node setup_firebase.mjs` |
| Duplicate image error | This is intentional (feature) |
| URLs showing broken | Clear browser cache |

---

**Last Updated**: March 18, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
