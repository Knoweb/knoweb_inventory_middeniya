-- Product Service Database Migration
-- Run this for product_db

USE product_db;

-- Add JSON column to products table
ALTER TABLE products 
ADD COLUMN industry_type VARCHAR(50) NULL AFTER org_id,
ADD COLUMN industry_specific_attributes JSON NULL AFTER industry_type;

-- Add index for faster filtering by industry type
CREATE INDEX idx_industry_type ON products(industry_type);

-- Add JSON column to batch_info table
ALTER TABLE batch_info
ADD COLUMN batch_attributes JSON NULL AFTER quantity;

-- Add JSON column to product_attributes_pharmacy table (if exists)
-- ALTER TABLE product_attributes_pharmacy
-- ADD COLUMN pharmacy_attributes JSON NULL AFTER product_id;

-- Verify columns were added
DESCRIBE products;
DESCRIBE batch_info;
