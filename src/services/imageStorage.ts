import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Initialize Firebase if credentials exist
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_STORAGE_BUCKET) {
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    firebaseInitialized = true;
    console.log("✅ Firebase initialized for image uploads");
  }
} catch (err) {
  console.warn("⚠️ Firebase not available, using local storage for images");
}

/**
 * Upload image to Firebase or local storage
 * @param imageBuffer - Buffer containing image data
 * @param storageKey - Unique key for the image (e.g., "topup/store-1/product-1/image.jpg")
 * @returns {Promise<string>} - URL of the uploaded image
 */
export async function uploadImageToStorage(imageBuffer, storageKey) {
  try {
    if (firebaseInitialized && admin.storage) {
      // Upload to Firebase Storage
      console.log(`🔥 Uploading to Firebase: ${storageKey}`);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(storageKey);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: "image/jpeg",
        },
      });
      
      // Get signed URL (valid for 100 years)
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 315360000000, // 100 years in milliseconds
      });
      
      console.log(`✅ Image uploaded to Firebase: ${storageKey}`);
      return url;
    } else {
      // Fallback: Save locally
      console.log(`💾 Saving to local storage: ${storageKey}`);
      
      const uploadsDir = path.join(process.cwd(), "uploads");
      const fullPath = path.join(uploadsDir, storageKey);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save file
      fs.writeFileSync(fullPath, imageBuffer);
      
      const localUrl = `/uploads/${storageKey}`;
      console.log(`✅ Image saved locally: ${localUrl}`);
      return localUrl;
    }
  } catch (err) {
    console.error(`❌ Error uploading image: ${err.message}`);
    throw err;
  }
}

/**
 * Delete image from Firebase or local storage
 * @param storageKey - The storage key of the image to delete
 */
export async function deleteImageFromStorage(storageKey) {
  try {
    if (firebaseInitialized && admin.storage) {
      // Delete from Firebase
      console.log(`🔥 Deleting from Firebase: ${storageKey}`);
      const bucket = admin.storage().bucket();
      await bucket.file(storageKey).delete();
      console.log(`✅ Image deleted from Firebase: ${storageKey}`);
    } else {
      // Delete from local storage
      console.log(`💾 Deleting from local storage: ${storageKey}`);
      const uploadsDir = path.join(process.cwd(), "uploads");
      const fullPath = path.join(uploadsDir, storageKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Image deleted locally: ${storageKey}`);
      }
    }
  } catch (err) {
    console.error(`❌ Error deleting image: ${err.message}`);
  }
}

/**
 * Generate unique storage key
 * @param folder - Folder path (e.g., "topup/store-1/product-5")
 * @returns {string} - Storage key
 */
export function generateStorageKey(folder) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const fileName = `image-${timestamp}-${randomStr}.jpg`;
  return `${folder}/${fileName}`;
}
