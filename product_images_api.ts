// 🖼️ Product Images API Endpoints
// أضفها إلى server.ts

export const setupProductImagesAPI = (app, pool) => {
  
  // الحصول على جميع صور المنتج
  app.get("/api/products/:productId/images", async (req, res) => {
    try {
      const { productId } = req.params;
      const result = await pool.query(
        `SELECT * FROM product_images 
         WHERE product_id = $1 AND is_deleted = false 
         ORDER BY position ASC, is_primary DESC, created_at DESC`,
        [productId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // الحصول على الصورة الأساسية للمنتج
  app.get("/api/products/:productId/image-primary", async (req, res) => {
    try {
      const { productId } = req.params;
      const result = await pool.query(
        `SELECT * FROM product_images 
         WHERE product_id = $1 AND is_primary = true AND is_deleted = false 
         LIMIT 1`,
        [productId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No primary image found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // إضافة صورة جديدة للمنتج
  app.post("/api/products/:productId/images", async (req, res) => {
    try {
      const { productId } = req.params;
      const { image_url, image_name, image_size, image_type, position, is_primary } = req.body;

      if (!image_url) {
        return res.status(400).json({ error: 'image_url is required' });
      }

      // إذا كانت الصورة الأساسية، أزل الأساسية السابقة
      if (is_primary) {
        await pool.query(
          `UPDATE product_images SET is_primary = false 
           WHERE product_id = $1 AND is_primary = true`,
          [productId]
        );
      }

      const result = await pool.query(
        `INSERT INTO product_images 
         (product_id, image_url, image_name, image_size, image_type, position, is_primary) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [productId, image_url, image_name, image_size, image_type, position || 0, is_primary || false]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // تحديث ترتيب الصور
  app.put("/api/products/:productId/images-reorder", async (req, res) => {
    try {
      const { productId } = req.params;
      const { images } = req.body; // Array of { id, position }

      if (!Array.isArray(images)) {
        return res.status(400).json({ error: 'images must be an array' });
      }

      for (const img of images) {
        await pool.query(
          `UPDATE product_images SET position = $1 WHERE id = $2 AND product_id = $3`,
          [img.position, img.id, productId]
        );
      }

      res.json({ message: 'Images reordered successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // جعل صورة أساسية
  app.put("/api/products/:productId/images/:imageId/set-primary", async (req, res) => {
    try {
      const { productId, imageId } = req.params;

      // تأكد من أن الصورة تنتمي للمنتج
      const imageCheck = await pool.query(
        `SELECT * FROM product_images WHERE id = $1 AND product_id = $2`,
        [imageId, productId]
      );

      if (imageCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // أزل الأساسية السابقة
      await pool.query(
        `UPDATE product_images SET is_primary = false WHERE product_id = $1`,
        [productId]
      );

      // اجعل هذه أساسية
      const result = await pool.query(
        `UPDATE product_images SET is_primary = true WHERE id = $1 RETURNING *`,
        [imageId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // حذف صورة (soft delete)
  app.delete("/api/products/:productId/images/:imageId", async (req, res) => {
    try {
      const { productId, imageId } = req.params;

      const result = await pool.query(
        `UPDATE product_images 
         SET is_deleted = true 
         WHERE id = $1 AND product_id = $2 
         RETURNING *`,
        [imageId, productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // حذف جميع صور المنتج
  app.delete("/api/products/:productId/images", async (req, res) => {
    try {
      const { productId } = req.params;

      await pool.query(
        `UPDATE product_images SET is_deleted = true WHERE product_id = $1`,
        [productId]
      );

      res.json({ message: 'All images deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✓ Product Images API endpoints registered');
};
