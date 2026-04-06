-- V2__Ensure_Warehouse_3_Exists.sql
-- This migration ensures warehouse 3 exists for stock operations
INSERT IGNORE INTO warehouses (id, name, location, org_id, warehouse_type, storage_capacity, status, is_active)
VALUES (3, 'Transit Warehouse', 'Dock Area', 18, 'TRANSIT', 2000, 'ACTIVE', TRUE);
