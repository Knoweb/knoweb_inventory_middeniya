-- =====================================================
-- STEP 1: Add ROLE_COMPANY to roles table
-- =====================================================
INSERT INTO roles (name, description) 
VALUES ('ROLE_COMPANY', 'Company/Organization owner role for multi-tenant SaaS')
ON DUPLICATE KEY UPDATE 
    description = 'Company/Organization owner role for multi-tenant SaaS';

-- =====================================================
-- STEP 2: Verify the role was inserted
-- =====================================================
SELECT 
    id as role_id,
    name as role_name,
    description
FROM roles 
WHERE name = 'ROLE_COMPANY';

-- =====================================================
-- STEP 3: Check which users have NO roles assigned
-- =====================================================
SELECT 
    u.id as user_id,
    u.email,
    u.org_id,
    u.is_active,
    COUNT(ur.role_id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.org_id, u.is_active
HAVING role_count = 0;

-- =====================================================
-- STEP 4: Check users who DO have roles (for comparison)
-- =====================================================
SELECT 
    u.id as user_id,
    u.email,
    u.org_id,
    GROUP_CONCAT(r.name) as assigned_roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.org_id;

-- =====================================================
-- STEP 5: Assign ROLE_COMPANY to a specific user
-- =====================================================
-- Replace YOUR_USER_EMAIL with your actual email:
SET @user_email = 'your-email@example.com';  -- ⚠️ CHANGE THIS!
SET @role_id = (SELECT id FROM roles WHERE name = 'ROLE_COMPANY' LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1);

SELECT CONCAT('User ID: ', @user_id, ', Role ID: ', @role_id) as verification;

-- ⚠️ Uncomment the next line after verifying the IDs above:
-- INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (@user_id, @role_id);

-- =====================================================
-- STEP 6: Verify role assignment
-- =====================================================
SELECT 
    u.email,
    r.name as assigned_role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = @user_email;
