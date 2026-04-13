-- =====================================================
-- STEP 1: Add Middeniya Manufacturing Roles to oles table
-- =====================================================

INSERT INTO roles (name, description) 
VALUES ('ROLE_INV_STOCK_KEEPER', 'Inventory/Stock management access')
ON DUPLICATE KEY UPDATE description = 'Inventory/Stock management access';

INSERT INTO roles (name, description) 
VALUES ('ROLE_INV_MOLDING', 'Molding department access')
ON DUPLICATE KEY UPDATE description = 'Molding department access';

INSERT INTO roles (name, description) 
VALUES ('ROLE_INV_QC', 'Quality Control access')
ON DUPLICATE KEY UPDATE description = 'Quality Control access';

INSERT INTO roles (name, description) 
VALUES ('ROLE_INV_ASSEMBLE', 'Assembly line access')
ON DUPLICATE KEY UPDATE description = 'Assembly line access';

INSERT INTO roles (name, description) 
VALUES ('ROLE_INV_PRIMARY', 'Primary Finishing access')
ON DUPLICATE KEY UPDATE description = 'Primary Finishing access';

-- =====================================================
-- STEP 2: Verify the roles were inserted
-- =====================================================
SELECT 
    id as role_id,
    name as role_name,
    description
FROM roles 
WHERE name LIKE 'ROLE_INV_%';
