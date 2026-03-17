-- إنشاء جدول صور المنتجات (يدعم تخزين عدد غير محدود من الصور)
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(50) DEFAULT 'jpeg', -- jpeg, png, webp, svg
  file_size INTEGER, -- bytes
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER REFERENCES users(id),
  FOREIGN KEY (store_id, product_id) REFERENCES products(store_id, id)
);

-- إضافة فهرس لتسريع البحث
CREATE INDEX idx_product_images_product_store 
ON product_images(store_id, product_id);

-- جدول لتخزين صور الممتجات (للمتاجر العادية)
CREATE TABLE IF NOT EXISTS store_product_images (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_type VARCHAR(50) DEFAULT 'jpeg',
  file_size INTEGER,
  position INTEGER DEFAULT 0, -- ترتيب الصور
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id, product_id) REFERENCES products(store_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_store_product_images 
ON store_product_images(store_id, product_id, position);

-- جدول للصور عالية الجودة (للإعلانات والعروض)
CREATE TABLE IF NOT EXISTS promotional_images (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  image_type VARCHAR(50) DEFAULT 'jpeg',
  file_size INTEGER,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotional_images_store 
ON promotional_images(store_id, is_active);
