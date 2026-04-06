-- Stock Valuation System Database Migration
-- Adds cost tracking fields and stock ledger table

-- ==========================================
-- 1. Update inventory_transactions table
-- ==========================================

-- Add cost tracking fields to inventory_transactions
ALTER TABLE inventory_transactions 
ADD COLUMN unit_price DECIMAL(19,4) AFTER quantity,
ADD COLUMN total_value DECIMAL(19,2) AFTER unit_price,
ADD COLUMN transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER total_value;

-- Add index for transaction date ordering
CREATE INDEX idx_transaction_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_product_warehouse_date ON inventory_transactions(product_id, warehouse_id, transaction_date);

-- ==========================================
-- 2. Create stock_ledger table
-- ==========================================

CREATE TABLE stock_ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    transaction_id BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    transaction_date DATETIME NOT NULL,
    
    -- Quantity tracking
    quantity_in INT DEFAULT 0,
    quantity_out INT DEFAULT 0,
    quantity_balance INT NOT NULL,
    
    -- Cost tracking
    unit_cost DECIMAL(19,4) NOT NULL,
    total_cost DECIMAL(19,2) NOT NULL,
    running_balance DECIMAL(19,2) NOT NULL,
    
    -- Valuation methods
    weighted_avg_cost DECIMAL(19,4),
    fifo_value DECIMAL(19,2),
    lifo_value DECIMAL(19,2),
    
    -- Reference and metadata
    reference_id VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    -- Indexes for performance
    INDEX idx_product_warehouse (product_id, warehouse_id),
    INDEX idx_org_product (org_id, product_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_id (transaction_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_ledger_transaction FOREIGN KEY (transaction_id) 
        REFERENCES inventory_transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. Sample data for testing
-- ==========================================

-- Example: Product 1, Warehouse 1 - FIFO scenario
-- Purchase 1: 100 units @ $10.00 each
INSERT INTO inventory_transactions 
(product_id, warehouse_id, type, quantity, unit_price, total_value, transaction_date, org_id, reference_id, notes)
VALUES 
(1, 1, 'IN', 100, 10.00, 1000.00, '2026-01-01 10:00:00', 1, 'PO-001', 'Initial purchase');

-- Purchase 2: 150 units @ $12.00 each
INSERT INTO inventory_transactions 
(product_id, warehouse_id, type, quantity, unit_price, total_value, transaction_date, org_id, reference_id, notes)
VALUES 
(1, 1, 'IN', 150, 12.00, 1800.00, '2026-01-15 10:00:00', 1, 'PO-002', 'Second purchase');

-- Purchase 3: 200 units @ $11.50 each
INSERT INTO inventory_transactions 
(product_id, warehouse_id, type, quantity, unit_price, total_value, transaction_date, org_id, reference_id, notes)
VALUES 
(1, 1, 'IN', 200, 11.50, 2300.00, '2026-02-01 10:00:00', 1, 'PO-003', 'Third purchase');

-- Sale 1: 120 units sold
INSERT INTO inventory_transactions 
(product_id, warehouse_id, type, quantity, unit_price, total_value, transaction_date, org_id, reference_id, notes)
VALUES 
(1, 1, 'OUT', 120, 11.00, 1320.00, '2026-02-10 14:00:00', 1, 'SO-001', 'Customer order');

-- ==========================================
-- 4. Valuation Comparison Query
-- ==========================================

-- Query to compare all three valuation methods
-- This shows the current stock value using FIFO, LIFO, and Weighted Average

-- Current stock balance
SELECT 
    product_id,
    warehouse_id,
    SUM(CASE WHEN type IN ('IN', 'RETURN') THEN quantity ELSE -quantity END) as current_quantity
FROM inventory_transactions
WHERE product_id = 1 AND warehouse_id = 1
GROUP BY product_id, warehouse_id;

-- Weighted Average Cost
SELECT 
    product_id,
    warehouse_id,
    SUM(CASE WHEN type IN ('IN', 'RETURN') THEN total_value ELSE 0 END) / 
    SUM(CASE WHEN type IN ('IN', 'RETURN') THEN quantity ELSE 0 END) as weighted_avg_cost
FROM inventory_transactions
WHERE product_id = 1 AND warehouse_id = 1
GROUP BY product_id, warehouse_id;

-- ==========================================
-- 5. Stock Ledger Report Query
-- ==========================================

-- Detailed stock ledger report with running balances
SELECT 
    sl.transaction_date,
    sl.transaction_type,
    sl.reference_id,
    sl.quantity_in,
    sl.quantity_out,
    sl.quantity_balance,
    sl.unit_cost,
    sl.total_cost,
    sl.running_balance,
    sl.weighted_avg_cost,
    sl.fifo_value,
    sl.lifo_value,
    sl.notes
FROM stock_ledger sl
WHERE sl.product_id = 1 AND sl.warehouse_id = 1
ORDER BY sl.transaction_date ASC;

-- ==========================================
-- 6. Valuation Difference Analysis
-- ==========================================

-- Find products with significant valuation differences
SELECT 
    sl.product_id,
    sl.warehouse_id,
    sl.quantity_balance,
    sl.fifo_value,
    sl.lifo_value,
    sl.weighted_avg_cost * sl.quantity_balance as weighted_avg_value,
    (sl.fifo_value - sl.lifo_value) as valuation_difference,
    ROUND(((sl.fifo_value - sl.lifo_value) / sl.fifo_value * 100), 2) as difference_percentage
FROM stock_ledger sl
INNER JOIN (
    SELECT product_id, warehouse_id, MAX(transaction_date) as max_date
    FROM stock_ledger
    GROUP BY product_id, warehouse_id
) latest ON sl.product_id = latest.product_id 
    AND sl.warehouse_id = latest.warehouse_id 
    AND sl.transaction_date = latest.max_date
WHERE sl.quantity_balance > 0
ORDER BY ABS(sl.fifo_value - sl.lifo_value) DESC;

-- ==========================================
-- 7. COGS Calculation Query
-- ==========================================

-- Calculate Cost of Goods Sold for outbound transactions
SELECT 
    DATE(transaction_date) as sale_date,
    COUNT(*) as num_transactions,
    SUM(quantity) as total_quantity_sold,
    SUM(total_value) as total_cogs,
    AVG(unit_price) as avg_unit_cost
FROM inventory_transactions
WHERE type = 'OUT' 
    AND product_id = 1 
    AND warehouse_id = 1
    AND transaction_date >= '2026-02-01'
GROUP BY DATE(transaction_date)
ORDER BY sale_date DESC;

-- ==========================================
-- 8. Inventory Turnover Analysis
-- ==========================================

-- Calculate inventory turnover ratio
SELECT 
    t.product_id,
    t.warehouse_id,
    -- Total COGS
    SUM(CASE WHEN t.type = 'OUT' THEN t.total_value ELSE 0 END) as total_cogs,
    -- Average inventory value (from ledger)
    AVG(sl.running_balance) as avg_inventory_value,
    -- Turnover ratio
    ROUND(SUM(CASE WHEN t.type = 'OUT' THEN t.total_value ELSE 0 END) / 
          AVG(sl.running_balance), 2) as turnover_ratio,
    -- Days inventory
    ROUND(365 / (SUM(CASE WHEN t.type = 'OUT' THEN t.total_value ELSE 0 END) / 
                 AVG(sl.running_balance)), 0) as days_inventory_outstanding
FROM inventory_transactions t
INNER JOIN stock_ledger sl ON t.product_id = sl.product_id 
    AND t.warehouse_id = sl.warehouse_id
WHERE t.transaction_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
GROUP BY t.product_id, t.warehouse_id
HAVING total_cogs > 0;

-- ==========================================
-- 9. Low Stock Alert Query
-- ==========================================

-- Products approaching reorder level based on valuation
SELECT 
    sl.product_id,
    sl.warehouse_id,
    sl.quantity_balance,
    s.reorder_level,
    sl.weighted_avg_cost,
    sl.weighted_avg_cost * s.reorder_level as reorder_value,
    sl.fifo_value as current_stock_value,
    CASE 
        WHEN sl.quantity_balance <= s.reorder_level THEN 'REORDER NOW'
        WHEN sl.quantity_balance <= s.reorder_level * 1.5 THEN 'LOW STOCK'
        ELSE 'OK'
    END as stock_status
FROM stock_ledger sl
INNER JOIN (
    SELECT product_id, warehouse_id, MAX(transaction_date) as max_date
    FROM stock_ledger
    GROUP BY product_id, warehouse_id
) latest ON sl.product_id = latest.product_id 
    AND sl.warehouse_id = latest.warehouse_id 
    AND sl.transaction_date = latest.max_date
INNER JOIN stock s ON sl.product_id = s.product_id 
    AND sl.warehouse_id = s.warehouse_id
WHERE s.reorder_level IS NOT NULL
    AND sl.quantity_balance <= s.reorder_level * 1.5
ORDER BY stock_status, sl.quantity_balance ASC;

-- ==========================================
-- 10. Clean up old ledger entries (maintenance)
-- ==========================================

-- Archive ledger entries older than 2 years
-- CREATE TABLE stock_ledger_archive LIKE stock_ledger;

-- INSERT INTO stock_ledger_archive
-- SELECT * FROM stock_ledger
-- WHERE transaction_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- DELETE FROM stock_ledger
-- WHERE transaction_date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
