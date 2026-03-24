/**
 * Image Upload Handler with Firebase Support
 * Saves image URLs in database and images in Firebase or local storage
 */

import { Pool } from "pg";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { mkdir } from "fs/promises";

// Mock Firebase functions if not available
let firebaseAvailable = false;
let admin: any = null;

try {
  admin = require("firebase-admin");
  if (admin && admin.storage) {
    firebaseAvailable = true;
  }
} catch (e) {
  console.log("⚠️ Firebase not available, using local storage");
}

/**
 * Upload image to storage (Firebase or Local)
 */
export async function uploadImage(imageBuffer: Buffer, storageKey: string): Promise<string> {
  try {
    if (firebaseAvailable && admin?.storage) {
      // Upload to Firebase
      console.log(`🔥 Uploading to Firebase: ${storageKey}`);
      const bucket = admin.storage().bucket();
      const file = bucket.file(storageKey);

      await file.save(imageBuffer, {
        metadata: { contentType: "image/jpeg" },
      });

      // Get signed URL (valid for 100 years)
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 315360000000,
      });

      console.log(`✅ Image uploaded to Firebase`);
      return url;
    } else {
      // Save to local storage
      console.log(`💾 Saving to local storage: ${storageKey}`);
      const uploadsDir = path.join(process.cwd(), "uploads");
      const fullPath = path.join(uploadsDir, storageKey);
      const dir = path.dirname(fullPath);

      await mkdir(dir, { recursive: true });
      fs.writeFileSync(fullPath, imageBuffer);

      const localUrl = `/uploads/${storageKey}`;
      console.log(`✅ Image saved locally`);
      return localUrl;
    }
  } catch (err) {
    console.error(`❌ Error uploading image:`, err);
    throw err;
  }
}

/**
 * Handle topup product image upload
 */
export async function handleTopupImageUpload(
  pool: Pool,
  storeId: number,
  productId: number,
  imageBuffer: Buffer,
  fileName?: string
): Promise<{ imageUrl: string; imageHash: string }> {
  try {
    // Generate storage key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const finalFileName = `${fileName || `image-${timestamp}-${randomStr}`}.jpg`;
    const storageKey = `topup/store-${storeId}/product-${productId}/${finalFileName}`;

    // Generate image hash for duplicate detection
    const imageHash = crypto.createHash("md5").update(imageBuffer).digest("hex");

    // Check for duplicates
    const duplicateCheck = await pool.query(
      `SELECT id FROM topup_product_images 
       WHERE store_id = $1 AND product_id = $2 AND image_hash = $3`,
      [storeId, productId, imageHash]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new Error("❌ صورة مكررة - تم تحميل هذه الصورة من قبل");
    }

    // Upload image to Firebase/Local storage
    const imageUrl = await uploadImage(imageBuffer, storageKey);

    // Save image URL to database
    const result = await pool.query(
      `INSERT INTO topup_product_images (store_id, product_id, image_url, image_hash, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, image_url`,
      [storeId, productId, imageUrl, imageHash]
    );

    console.log(`✅ Image saved to database with URL: ${imageUrl}`);
    return {
      imageUrl: result.rows[0].image_url,
      imageHash,
    };
  } catch (err) {
    console.error(`❌ Error handling topup image upload:`, err);
    throw err;
  }
}

/**
 * Handle regular product image upload
 */
export async function handleProductImageUpload(
  pool: Pool,
  storeId: number,
  productId: number,
  imageBuffer: Buffer,
  fileName?: string
): Promise<string> {
  try {
    // Generate storage key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const finalFileName = `${fileName || `image-${timestamp}-${randomStr}`}.jpg`;
    const storageKey = `products/store-${storeId}/product-${productId}/${finalFileName}`;

    // Upload image to Firebase/Local storage
    const imageUrl = await uploadImage(imageBuffer, storageKey);

    console.log(`✅ Product image uploaded: ${imageUrl}`);
    return imageUrl;
  } catch (err) {
    console.error(`❌ Error handling product image upload:`, err);
    throw err;
  }
}

/**
 * Delete image from storage
 */
export async function deleteImageFromStorage(storageKey: string): Promise<void> {
  try {
    if (firebaseAvailable && admin?.storage) {
      console.log(`🔥 Deleting from Firebase: ${storageKey}`);
      const bucket = admin.storage().bucket();
      await bucket.file(storageKey).delete();
      console.log(`✅ Image deleted from Firebase`);
    } else {
      console.log(`💾 Deleting from local: ${storageKey}`);
      const uploadsDir = path.join(process.cwd(), "uploads");
      const fullPath = path.join(uploadsDir, storageKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Image deleted locally`);
      }
    }
  } catch (err) {
    console.error(`❌ Error deleting image:`, err);
  }
}
