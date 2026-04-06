-- INDUSTRY-SPECIFIC FEATURES DATABASE MIGRATION SCRIPT
-- This script creates tables for Pharmacy, Retail, and Manufacturing features
-- Version: 1.0
-- Date: 2024

-- ==========================================
-- PHARMACY PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS pharmacy_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    
    -- Batch Tracking
    batch_number VARCHAR(100),
    batch_size INTEGER,
    manufacturing_date DATE,
    
    -- Expiry Management
    expiry_date DATE,
    shelf_life_days INTEGER,
    days_until_expiry INTEGER,
    is_expired BOOLEAN DEFAULT FALSE,
    storage_conditions TEXT,
    
    -- Prescription Management
    is_prescription_required BOOLEAN DEFAULT FALSE,
    prescription_type VARCHAR(50) COMMENT 'RX, OTC, CONTROLLED',
    controlled_substance_schedule VARCHAR(10) COMMENT 'I, II, III, IV, V',
    
    -- Drug Information
    active_ingredient VARCHAR(255),
    strength VARCHAR(100),
    dosage_form VARCHAR(100),
    ndc_code VARCHAR(50),
    drug_class VARCHAR(100),
    
    -- Storage Requirements
    requires_refrigeration BOOLEAN DEFAULT FALSE,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    
    -- Safety Information
    warning_labels TEXT,
    side_effects TEXT,
    interactions TEXT,
    
    -- Recall Management
    is_recalled BOOLEAN DEFAULT FALSE,
    recall_date DATE,
    recall_reason TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_pharmacy_org_id (org_id),
    INDEX idx_pharmacy_product_id (product_id),
    INDEX idx_pharmacy_batch_number (batch_number),
    INDEX idx_pharmacy_expiry_date (expiry_date),
    INDEX idx_pharmacy_is_expired (is_expired),
    INDEX idx_pharmacy_prescription (is_prescription_required),
    INDEX idx_pharmacy_controlled (controlled_substance_schedule),
    INDEX idx_pharmacy_recalled (is_recalled),
    INDEX idx_pharmacy_refrigeration (requires_refrigeration),
    
    CONSTRAINT fk_pharmacy_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT  CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pharmacy-specific product attributes including batch tracking, expiry dates, and prescription management';

-- ==========================================
-- RETAIL PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS retail_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    
    -- Variant Management
    parent_sku VARCHAR(100),
    variant_sku VARCHAR(100),
    is_master_product BOOLEAN DEFAULT FALSE,
    
    -- Size Attributes
    size_category VARCHAR(50) COMMENT 'CLOTHING, SHOES, ACCESSORIES, etc',
    size_value VARCHAR(50) COMMENT 'S, M, L, XL, 8, 10, etc',
    size_numeric DECIMAL(10,2),
    size_unit VARCHAR(20),
    
    -- Color Attributes
    color_name VARCHAR(100),
    color_code VARCHAR(20) COMMENT 'Hex code',
    color_family VARCHAR(50) COMMENT 'RED, BLUE, GREEN, etc',
    color_images JSON COMMENT 'Array of image URLs',
    
    -- Style Information
    style_name VARCHAR(100),
    pattern VARCHAR(100),
    material VARCHAR(255),
    
    -- Seasonal Tracking
    season VARCHAR(50) COMMENT 'SPRING, SUMMER, FALL, WINTER',
    season_year INTEGER,
    collection_name VARCHAR(100),
    is_seasonal BOOLEAN DEFAULT FALSE,
    launch_date DATETIME,
    end_of_season_date DATETIME,
    
    -- Pricing & Promotions
    msrp DECIMAL(19,2),
    sale_price DECIMAL(19,2),
    is_on_sale BOOLEAN DEFAULT FALSE,
    discount_percentage DECIMAL(5,2),
    promotion_code VARCHAR(50),
    promotion_start_date DATETIME,
    promotion_end_date DATETIME,
    
    -- Display Features
    is_featured BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_clearance BOOLEAN DEFAULT FALSE,
    
    -- Flexible Attributes
    custom_attributes JSON,
    tags JSON COMMENT 'Array of tags',
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_retail_org_id (org_id),
    INDEX idx_retail_product_id (product_id),
    INDEX idx_retail_parent_sku (parent_sku),
    INDEX idx_retail_variant_sku (variant_sku),
    INDEX idx_retail_color_name (color_name),
    INDEX idx_retail_color_family (color_family),
    INDEX idx_retail_size_value (size_value),
    INDEX idx_retail_season (season, season_year),
    INDEX idx_retail_collection (collection_name),
    INDEX idx_retail_on_sale (is_on_sale),
    INDEX idx_retail_clearance (is_clearance),
    INDEX idx_retail_featured (is_featured),
    INDEX idx_retail_bestseller (is_bestseller),
    INDEX idx_retail_new_arrival (is_new_arrival),
    
    CONSTRAINT fk_retail_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Retail-specific product attributes including size/color variants and seasonal tracking';

-- ==========================================
-- MANUFACTURING PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS manufacturing_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    
    -- Product Type
    product_type VARCHAR(50) NOT NULL COMMENT 'RAW_MATERIAL, WIP, FINISHED_GOOD, COMPONENT',
    
    -- Material Information
    material_code VARCHAR(100),
    part_number VARCHAR(100),
    revision VARCHAR(50),
    material_grade VARCHAR(100),
    material_specification TEXT,
    supplier_material_code VARCHAR(100),
    
    -- Traceability
    lot_number VARCHAR(100),
    heat_number VARCHAR(100),
    certificate_number VARCHAR(100),
    
    -- Bill of Materials (BOM)
    bom_items JSON COMMENT 'Array of component items with quantities',
    bom_level INTEGER DEFAULT 0,
    parent_product_id BIGINT,
    
    -- Work-in-Progress (WIP) Tracking
    wip_status VARCHAR(50) COMMENT 'QUEUED, IN_PROGRESS, ON_HOLD, COMPLETED, SCRAPPED',
    work_order_number VARCHAR(100),
    production_line VARCHAR(100),
    operation_sequence INTEGER,
    current_operation VARCHAR(255),
    next_operation VARCHAR(255),
    completion_percentage DECIMAL(5,2),
    wip_start_date DATETIME,
    wip_completion_date DATETIME,
    estimated_completion_date DATETIME,
    
    -- Cost Tracking
    material_cost DECIMAL(19,2),
    labor_cost DECIMAL(19,2),
    overhead_cost DECIMAL(19,2),
    total_manufacturing_cost DECIMAL(19,2),
    scrap_cost DECIMAL(19,2),
    
    -- Quality Control
    quality_grade VARCHAR(50) COMMENT 'A, B, C, REJECT',
    inspection_status VARCHAR(50) COMMENT 'PENDING, PASSED, FAILED, IN_PROGRESS',
    inspection_date DATETIME,
    inspector_id VARCHAR(100),
    defect_count INTEGER DEFAULT 0,
    defect_description TEXT,
    rework_required BOOLEAN DEFAULT FALSE,
    rework_count INTEGER DEFAULT 0,
    
    -- Production Tracking
    machine_id VARCHAR(100),
    operator_id VARCHAR(100),
    cycle_time_minutes INTEGER,
    standard_labor_hours DECIMAL(10,2),
    actual_labor_hours DECIMAL(10,2),
    
    -- Compliance & Traceability
    serial_number_required BOOLEAN DEFAULT FALSE,
    batch_tracking_required BOOLEAN DEFAULT FALSE,
    traceability_level VARCHAR(50) COMMENT 'NONE, BATCH, SERIAL, FULL',
    traceability_data JSON COMMENT 'Full traceability chain',
    
    -- Flexible Attributes
    manufacturing_attributes JSON,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    INDEX idx_manufacturing_org_id (org_id),
    INDEX idx_manufacturing_product_id (product_id),
    INDEX idx_manufacturing_product_type (product_type),
    INDEX idx_manufacturing_material_code (material_code),
    INDEX idx_manufacturing_part_number (part_number),
    INDEX idx_manufacturing_lot_number (lot_number),
    INDEX idx_manufacturing_wip_status (wip_status),
    INDEX idx_manufacturing_work_order (work_order_number),
    INDEX idx_manufacturing_production_line (production_line),
    INDEX idx_manufacturing_parent (parent_product_id),
    INDEX idx_manufacturing_bom_level (bom_level),
    INDEX idx_manufacturing_inspection (inspection_status),
    INDEX idx_manufacturing_rework (rework_required),
    INDEX idx_manufacturing_completion_date (estimated_completion_date),
    
    CONSTRAINT fk_manufacturing_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_manufacturing_parent FOREIGN KEY (parent_product_id) 
        REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Manufacturing-specific product attributes including raw materials, WIP tracking, and BOM management';

-- ==========================================
-- ADD INDUSTRY TYPE TO PRODUCTS TABLE
-- ==========================================
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50) DEFAULT 'GENERAL' 
    COMMENT 'PHARMACY, RETAIL, MANUFACTURING, GENERAL'
    AFTER category_id;

ALTER TABLE products 
    ADD INDEX IF NOT EXISTS idx_products_industry_type (industry_type);

-- ==========================================
-- SAMPLE DATA (Optional)
-- ==========================================

-- Sample Pharmacy Product
-- INSERT INTO pharmacy_products (org_id, product_id, batch_number, expiry_date, is_prescription_required, active_ingredient, strength)
-- VALUES (1, 1, 'BATCH-2024-001', '2025-12-31', TRUE, 'Amoxicillin', '500mg');

-- Sample Retail Product
-- INSERT INTO retail_products (org_id, product_id, parent_sku, variant_sku, color_name, size_value, season)
-- VALUES (1, 2, 'TSHIRT-001', 'TSHIRT-001-RED-M', 'Red', 'M', 'SUMMER');

-- Sample Manufacturing Product
-- INSERT INTO manufacturing_products (org_id, product_id, product_type, material_code, wip_status)
-- VALUES (1, 3, 'RAW_MATERIAL', 'STEEL-304', 'IN_PROGRESS');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%_products';

-- SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
-- FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pharmacy_products'
-- ORDER BY ORDINAL_POSITION;
