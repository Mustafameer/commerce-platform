# 🖼️ Image Upload System - Complete Guide

## 📌 Overview

Your platform now has a **dual-storage image system**:

| Storage Type | Configuration | Status |
|-------------|----------|--------|
| **Local Storage** | Default (no setup needed) | ✅ Ready now |
| **Firebase** | Optional (configure if you want) | 📋 Available |

---

## ✅ How It Works Now (Local Storage)

### Step 1: Add Topup Product
```json
POST /api/topup/products
{
  "store_id": 1,
  "company_id": 5,
  "amount": 35000,
  "price": 40000,
  "category_id": 1
}
```

### Step 2: Upload Images
```json
POST /api/topup/upload-images-firebase
{
  "store_id": 1,
  "topup_product_id": 123,
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

### Result
- ✅ Image saved to `/uploads/topup/store-1/product-123/image-123-abc.jpg`
- ✅ URL stored in database: `/uploads/topup/store-1/product-123/image-123-abc.jpg`
- ✅ Duplicate detection via MD5 hash

---

## 🔥 Optional: Setup Firebase (Advanced)

### Why Firebase?
- ☁️ Cloud storage (scalable)
- 🌍 Global CDN (fast delivery)
- 🔄 Auto-replicated (reliable)
- 📊 Usage monitoring

### Quick Setup (5 minutes)

#### Step 1: Run Setup Script
```bash
node setup_firebase.mjs
```

This will:
1. Ask for your Firebase service account JSON
2. Extract credentials
3. Generate .env configuration
4. Optional: Save directly to .env

#### Step 2: Restart Server
```bash
npm start
```

The system will **automatically detect Firebase** and use it for:
- 🖼️ Image uploads
- 📍 URL storage
- 🗑️ Image deletion

---

## 📊 Database Schema

### Tables Used

#### `topup_products`
```sql
SELECT columns for images:
- id: integer
- store_id: integer  
- product_id: integer
- images: text[] ← Array of image URLs
```

#### `topup_product_images` (Image Metadata)
```sql
- id: integer
- store_id: integer
- product_id: integer ← FK to topup_products
- image_url: text ← URL (Firebase or local)
- image_hash: text ← MD5 for duplicate detection
- uploaded_at: timestamp
```

---

## 🎯 Image Lifecycle

```
User uploads image from browser (Base64)
              ↓
         API receives request
              ↓
    Convert Base64 → Buffer
              ↓
      Generate MD5 hash
              ↓
   Check for duplicates
              ↓
    ┌─────────────────────────┐
    │ Firebase configured?    │
    └──────┬──────────┬───────┘
         YES│          │NO
           ↓           ↓
      Firebase       Local
      Storage        Storage
           │           │
           └──────┬────┘
                  ↓
          Get image URL
                  ↓
       Save URL to database
                  ↓
    Return URL to frontend
```

---

## 🛠️ API Endpoints

### 1. Create Topup Product
```
POST /api/topup/products
Content-Type: application/json

{
  "store_id": 1,
  "company_id": 5,
  "amount": 35000,
  "price": 40000,
  "bulk_price": 37000,
  "category_id": 1
}

Response:
{
  "id": 123,
  "store_id": 1,
  "company_id": 5,
  "amount": 35000,
  "price": 40000
}
```

### 2. Add Images to Product
```
POST /api/topup/upload-images-firebase
Content-Type: application/json

{
  "store_id": 1,
  "topup_product_id": 123,
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  ]
}

Response:
{
  "success": true,
  "message": "تم تحميل 2 صورة جديدة بنجاح",
  "image_urls": [
    "/uploads/topup/store-1/product-123/image-1.jpg",
    "/uploads/topup/store-1/product-123/image-2.jpg"
  ]
}
```

### 3. Remove Image
```
POST /api/topup/products/123/remove-image
Content-Type: application/json

{
  "image_url": "/uploads/topup/store-1/product-123/image-1.jpg"
}

Response:
{
  "success": true,
  "message": "تم حذف الصورة بنجاح"
}
```

---

## 🔍 Database Queries

### View All Images for a Product
```sql
SELECT * FROM topup_product_images 
WHERE product_id = 123 AND store_id = 1
ORDER BY uploaded_at DESC;
```

### View Image Array in Product
```sql
SELECT id, images FROM topup_products WHERE id = 123;

-- Returns:
id: 123
images: [
  "/uploads/topup/store-1/product-123/image-1.jpg",
  "/uploads/topup/store-1/product-123/image-2.jpg"
]
```

### Find Duplicate Images
```sql
SELECT image_hash, COUNT(*) as count 
FROM topup_product_images 
WHERE store_id = 1 
GROUP BY image_hash 
HAVING COUNT(*) > 1;
```

---

## 🐛 Troubleshooting

### Problem: Images saved but can't view
**Solution**: Check `/uploads` directory exists
```bash
ls -la uploads/
```

### Problem: Firebase setup not working
**Solution**: Verify environment variables
```bash
echo $FIREBASE_PROJECT_ID
```

### Problem: "صورة مكررة" error
**Solution**: This is intentional - same image detected
- Use different image
- Delete old product and retry

### Problem: Image URLs are broken
- **Local**: Check `/uploads` directory structure
- **Firebase**: Verify signed URL token is valid

---

## 📝 Frontend Implementation

### React/Vue Upload Handler
```javascript
// Convert image to Base64
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload to API
async function uploadProductImage(file) {
  const base64 = await imageToBase64(file);
  
  const response = await fetch('/api/topup/upload-images-firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: 1,
      topup_product_id: 123,
      images: [base64]
    })
  });
  
  const data = await response.json();
  return data.image_urls[0]; // Get uploaded URL
}
```

---

## 🚀 Production Deployment

### Before Going Live
- [ ] Test local image uploads
- [ ] Test Firebase (if using)
- [ ] Verify image URLs are accessible
- [ ] Check storage capacity
- [ ] Setup backup strategy

### Firebase Best Practices
1. **Enable CDN** - Use Firebase CDN for images
2. **Set TTL** - Configure image cache lifetime
3. **Monitor** - Check usage in Firebase Console
4. **Backup** - Regular exports to Google Cloud

---

## 📚 Files Modified

- ✅ `server.ts` - Upload endpoints
- ✅ `src/lib/imageUpload.ts` - Upload logic
- ✅ `.env.example` - Configuration template
- ✅ `IMAGE_UPLOAD_SETUP.md` - Detailed guide
- ✅ `setup_firebase.mjs` - Setup script

---

## ⚡ Next Steps

### Option 1: Use Local Storage (Now)
- ✅ Images work immediately
- ✅ No setup required
- ✅ Perfect for development

### Option 2: Use Firebase (Later)
- 🏃 Run: `node setup_firebase.mjs`
- 🚀 Restart: `npm start`
- 📊 Monitor in Firebase Console

---

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Last Updated**: March 18, 2026
