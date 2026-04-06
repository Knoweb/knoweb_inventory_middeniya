-- ✅ CRITICAL FIX #3: Database constraints to prevent negative stock
-- This migration adds CHECK constraints to prevent negative values from being stored in the database

-- Add version column if not exists (for optimistic locking)
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- ✅ CRITICAL FIX: Update all NULL versions to 0 to avoid NullPointerException
UPDATE stocks SET version = 0 WHERE version IS NULL;

-- Add CHECK constraints to ensure quantities cannot go negative
ALTER TABLE stocks
ADD CONSTRAINT chk_quantity_non_negative 
    CHECK (quantity >= 0),
ADD CONSTRAINT chk_available_quantity_non_negative 
    CHECK (available_quantity >= 0),
ADD CONSTRAINT chk_reserved_quantity_non_negative 
    CHECK (reserved_quantity >= 0);

-- Create index for faster lookups during locking
CREATE INDEX IF NOT EXISTS idx_product_warehouse_lock 
ON stocks(product_id, warehouse_id);
