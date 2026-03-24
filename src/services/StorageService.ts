/**
 * طبقة تجريد للـ Storage
 * تسهل التبديل من Local → Firebase/S3/CDN مستقبلاً
 * 
 * الاستخدام:
 * const storage = new StorageService();
 * const url = await storage.upload(base64Data, 'folder/file.jpg');
 * const data = await storage.download(url);
 */

export class StorageService {
  private provider: 'local' | 'firebase' | 's3' = 'local';

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER as any) || 'local';
  }

  /**
   * رفع ملف
   * @param base64Data - البيانات بصيغة base64
   * @param path - المسار (مثل: products/image.jpg)
   * @returns رابط الملف
   */
  async upload(base64Data: string, path: string): Promise<string> {
    switch (this.provider) {
      case 'firebase':
        return this.uploadToFirebase(base64Data, path);
      case 's3':
        return this.uploadToS3(base64Data, path);
      case 'local':
      default:
        return this.uploadToLocal(base64Data, path);
    }
  }

  /**
   * تحميل ملف
   */
  async download(url: string): Promise<Buffer> {
    // منطق موحد للتحميل
    if (url.startsWith('http')) {
      const response = await fetch(url);
      return Buffer.from(await response.arrayBuffer());
    }
    return Buffer.from(''); // local files
  }

  /**
   * حذف ملف
   */
  async delete(url: string): Promise<void> {
    switch (this.provider) {
      case 'firebase':
        await this.deleteFromFirebase(url);
        break;
      case 's3':
        await this.deleteFromS3(url);
        break;
      case 'local':
      default:
        await this.deleteFromLocal(url);
    }
  }

  // ---- LOCAL STORAGE ----
  private async uploadToLocal(base64Data: string, path: string): Promise<string> {
    const fs = await import('fs').then(m => m.promises);
    const nodePath = await import('path');
    const uploadsDir = nodePath.join(process.cwd(), 'public', 'uploads');
    
    const fullPath = nodePath.join(uploadsDir, path);
    const dir = nodePath.dirname(fullPath);
    
    // إنشاء المجلدات
    await fs.mkdir(dir, { recursive: true });
    
    // إزالة prefix
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    await fs.writeFile(fullPath, buffer);
    
    return `/uploads/${path}`;
  }

  private async deleteFromLocal(url: string): Promise<void> {
    const fs = await import('fs').then(m => m.promises);
    const nodePath = await import('path');
    const filePath = nodePath.join(process.cwd(), 'public', url);
    await fs.unlink(filePath).catch(() => {}); // ignore if not exists
  }

  // ---- FIREBASE STORAGE ----
  private async uploadToFirebase(base64Data: string, path: string): Promise<string> {
    try {
      const admin = await import('firebase-admin');
      const bucket = admin.storage().bucket();
      
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const file = bucket.file(path);
      
      await file.save(buffer, {
        metadata: { contentType: 'image/jpeg' }
      });
      
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      
      return url;
    } catch (err) {
      console.error('Firebase upload failed:', err);
      // fallback to local
      return this.uploadToLocal(base64Data, path);
    }
  }

  private async deleteFromFirebase(url: string): Promise<void> {
    // استخراج path من URL وحذفه
    console.log('Firebase delete not implemented');
  }

  // ---- AWS S3 ----
  private async uploadToS3(base64Data: string, path: string): Promise<string> {
    // TODO: Implement AWS SDK
    console.log('S3 upload not implemented');
    return '';
  }

  private async deleteFromS3(url: string): Promise<void> {
    console.log('S3 delete not implemented');
  }
}

export default new StorageService();
