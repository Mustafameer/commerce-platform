    // Download original image for authenticated orders only
    app.get("/api/topup/download-image/:imageId", async (req, res) => {
      try {
        const { imageId } = req.params;
        const { orderId, customerId } = req.query;

        if (!imageId || !orderId || !customerId) {
          return res.status(400).json({ error: "Missing required parameters: imageId, orderId, customerId" });
        }

        // Verify the customer owns this order
        const orderCheck = await pool.query(
          `SELECT id, topup_customer_id FROM orders 
           WHERE id = $1 AND topup_customer_id = $2 AND is_topup_order = true`,
          [orderId, customerId]
        );

        if (orderCheck.rows.length === 0) {
          return res.status(403).json({ error: "Order not found or unauthorized" });
        }

        // Get the image URL from the database
        const imageQuery = await pool.query(
          `SELECT id, image_url_original, image_type FROM topup_product_images 
           WHERE id = $1`,
          [imageId]
        );

        if (imageQuery.rows.length === 0) {
          return res.status(404).json({ error: "Image not found" });
        }

        const { image_url_original, image_type } = imageQuery.rows[0];
        
        if (!image_url_original) {
          return res.status(404).json({ error: "Original image not available" });
        }

        // Construct the file path
        const filePath = path.join(__dirname, 'public', image_url_original);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Image file not found on server" });
        }

        // Set appropriate headers
        const mimeType = image_type || 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="image-${imageId}-original"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Stream the file
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        
        stream.on('error', (err) => {
          console.error('Error streaming image:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading image" });
          }
        });

      } catch (error) {
        console.error('Error in download-image endpoint:', error);
        res.status(500).json({ error: (error as any).message });
      }
    });
