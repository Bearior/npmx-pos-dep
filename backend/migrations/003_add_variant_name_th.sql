-- Add Thai name column to product_variants for translation support
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name_th TEXT;
