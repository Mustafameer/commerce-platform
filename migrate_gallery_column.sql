-- Migration: Add gallery column to products table
-- This script adds the gallery column if it doesn't already exist

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';

-- Create an index for better performance when querying gallery
CREATE INDEX IF NOT EXISTS idx_products_gallery ON products USING GIN(gallery);

-- Display success message
SELECT 'Migration completed: gallery column added to products table' as status;
