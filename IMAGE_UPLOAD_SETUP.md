# 🖼️ Image Upload System - Firebase Integration

## ⚙️ How It Works

### Current System
- **Images**: Saved locally in `/uploads` directory
- **URLs**: Stored in database pointing to `/uploads/...`
- **Format**: Fully functional, works without Firebase

### Firebase Integration (Optional)
- **Images**: Uploaded to Firebase Storage
- **URLs**: Stored in database pointing to Firebase signed URLs
- **Format**: Same structure, just different storage backend

---

## 🚀 Setup Firebase (Optional)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Storage in the project

### Step 2: Get Service Account Credentials
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file with credentials

### Step 3: Configure Environment Variables
Add to your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**⚠️ Important**: When copying `FIREBASE_PRIVATE_KEY`, make sure to:
- Wrap it in quotes
- Use `\n` for newlines (replace actual newlines with `\n`)

### Step 4: Configure Storage Rules
In Firebase Console → Storage → Rules, set:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📝 Database Schema

### topup_products
```sql
- id: integer (primary key)
- store_id: integer
- company_id: integer
- category_id: integer  -- NEW COLUMN
- amount: numeric
- price: numeric
- images: text[] (array of URLs)
```

### topup_product_images
```sql
- id: integer (primary key)
- store_id: integer
- product_id: integer
- image_url: text (Firebase URL or local path)
- image_hash: text (MD5 hash for duplicate detection)
- uploaded_at: timestamp
```

---

## 🎯 How Images Are Handled

### Adding a Product with Images

**Frontend → API**
```
POST /api/topup/products
Body: {
  store_id: 1,
  company_id: 5,
  amount: 35000,
  price: 40000,
  category_id: 1
}
```

**Optional: Add Images Later**
```
POST /api/topup/upload-images-firebase
Body: {
  store_id: 1,
  topup_product_id: 123,
  images: [base64_image_1, base64_image_2, ...]
}
```

### What Happens
1. ✅ Image is converted from base64 to buffer
2. ✅ MD5 hash is generated for duplicate detection
3. ✅ Image is uploaded to **Firebase OR Local Storage**
4. ✅ Image URL is saved to `topup_product_images` table
5. ✅ Image URLs are appended to `topup_products.images` array

---

## 🔄 Storage Backends

### Local Storage (Default, No Setup Required)
- **Location**: `/uploads/topup/store-{id}/product-{id}/image-*.jpg`
- **URL Format**: `/uploads/topup/store-1/product-5/image-123-abc.jpg`
- **Pros**: No external dependency, works offline
- **Cons**: Images tied to server, not cloud-replicated

### Firebase Storage (Optional)
- **Location**: `topup/store-{id}/product-{id}/image-*.jpg`
- **URL Format**: `https://firestore-url.../image-*.jpg?token=...`
- **Pros**: Cloud-stored, globally distributed, auto-replicated
- **Cons**: Requires Firebase setup and credentials

---

## 🚨 Switching Between Storage

**The system automatically detects Firebase credentials:**

| Environment | Behavior |
|------------|----------|
| Firebase `env` vars set | Uses **Firebase** |
| Firebase `env` vars empty/missing | Uses **Local Storage** |

**No code changes needed!** Just configure the environment.

---

## 📊 API Endpoints

### 1. Upload Images to Topup Product
```bash
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
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحميل 2 صورة جديدة بنجاح",
  "image_urls": [
    "https://firebase-url.../image-1.jpg?token=...",
    "https://firebase-url.../image-2.jpg?token=..."
  ]
}
```

### 2. Remove Image from Product
```bash
POST /api/topup/products/{productId}/remove-image
Content-Type: application/json

{
  "image_url": "https://firebase-url.../image-1.jpg?token=..."
}
```

---

## ✨ Best Practices

1. **Use HTTPS** - Always serve images over HTTPS
2. **Set Expiry** - Firebase URLs are signed for 100 years
3. **Backup** - Regularly backup images from Firebase
4. **Optimize** - Compress images before upload
5. **CDN** - Use Firebase CDN for fast delivery

---

## 🐛 Troubleshooting

### Firebase Connection Issues
```
⚠️ Firebase not available, using local storage
```
**Solution**: Check your environment variables are correctly set

### Images Not Uploading
```
❌ Error uploading image: PERMISSION_DENIED
```
**Solution**: Check Firebase Storage rules allow writes

### Duplicate Image Error
```
❌ صورة مكررة - تم تحميل هذه الصورة من قبل
```
**Solution**: This is intentional - same image hash detected. Upload a different image.

---

## 📚 References

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Signed URLs](https://firebase.google.com/docs/storage/admin/start#signed-urls)
- [Express File Upload](https://expressjs.com/en/resources/middleware/multer.html)

---

**Created**: March 18, 2026  
**Status**: ✅ Production Ready
