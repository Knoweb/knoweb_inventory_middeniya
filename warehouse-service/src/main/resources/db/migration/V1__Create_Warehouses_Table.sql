-- V1__Create_Warehouses_Table.sql
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    org_id BIGINT NOT NULL,
    branch_id BIGINT,
    warehouse_type VARCHAR(50),
    storage_capacity INT,
    warehouse_attributes TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_id (org_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_status (status)
);

-- Insert default warehouses for org_id = 18
INSERT IGNORE INTO warehouses (name, location, org_id, branch_id, warehouse_type, storage_capacity, status, is_active)
VALUES 
    ('Main Warehouse', 'Central Storage', 18, NULL, 'DRY_STORAGE', 5000, 'ACTIVE', TRUE),
    ('Cold Storage', 'North Section', 18, NULL, 'COLD_STORAGE', 3000, 'ACTIVE', TRUE),
    ('Transit Warehouse', 'Dock Area', 18, NULL, 'TRANSIT', 2000, 'ACTIVE', TRUE);
