-- ================================================================
-- DIAGNOSE & FIX: Empty Roles Array in JWT Token (roles=[])
-- ================================================================
-- This script will help you find users without roles and assign ROLE_COMPANY
-- Run each section step-by-step and review the output

USE identity_db;

-- ================================================================
-- STEP 1: Check if ROLE_COMPANY exists in roles table
-- ================================================================
SELECT 
    id,
    name,
    description
FROM roles 
WHERE name = 'ROLE_COMPANY';

-- If no results, run this:
INSERT INTO roles (name, description) 
VALUES ('ROLE_COMPANY', 'Company/Organization owner role for multi-tenant SaaS')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ================================================================
-- STEP 2: Find ALL users and their role count
-- ================================================================
SELECT 
    u.id as user_id,
    u.email,
    u.org_id,
    u.is_active,
    COUNT(ur.role_id) as roles_count,
    GROUP_CONCAT(r.name ORDER BY r.name) as assigned_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.org_id, u.is_active
ORDER BY roles_count ASC, u.id;

-- EXPECTED OUTPUT:
-- Users with roles_count = 0 → These will have roles=[] in JWT token ❌
-- Users with roles_count > 0 → These will have roles populated ✅

-- ================================================================
-- STEP 3: Find users with ZERO roles (the problem users)
-- ================================================================
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id,
    'NO ROLES! This user will get roles=[] in JWT token' as issue
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role_id IS NULL
ORDER BY u.id;

-- ================================================================
-- STEP 4: Assign ROLE_COMPANY to a specific user by EMAIL
-- ================================================================
-- ⚠️ CHANGE THIS TO YOUR USER'S EMAIL:
SET @target_email = 'your-email@example.com';  -- ⚠️ CHANGE THIS!

-- Get user ID and role ID
SET @user_id = (SELECT id FROM users WHERE email = @target_email LIMIT 1);
SET @role_id = (SELECT id FROM roles WHERE name = 'ROLE_COMPANY' LIMIT 1);

-- Display what will be inserted:
SELECT 
    @user_id as user_id,
    (SELECT email FROM users WHERE id = @user_id) as user_email,
    @role_id as role_id,
    (SELECT name FROM roles WHERE id = @role_id) as role_name,
    'Ready to assign this role to this user' as status;

-- ⚠️ UNCOMMENT THE NEXT LINE AFTER VERIFYING THE ABOVE OUTPUT:
-- INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (@user_id, @role_id);

-- ================================================================
-- STEP 5: Verify role was assigned
-- ================================================================
SELECT 
    u.id,
    u.email,
    r.name as assigned_role,
    '✅ SUCCESS: User now has role!' as status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = @target_email;

-- If no results, the INSERT didn't work (check if you uncommented line 66)

-- ================================================================
-- STEP 6: Assign ROLE_COMPANY to ALL users with no roles (BULK FIX)
-- ================================================================
-- ⚠️ WARNING: This will assign ROLE_COMPANY to EVERY user that has no roles
-- Only use this if you want ALL users to have ROLE_COMPANY

-- First, preview what will be assigned:
SELECT 
    u.id as user_id,
    u.email,
    'ROLE_COMPANY' as role_to_assign,
    'Will be inserted into user_roles' as action
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role_id IS NULL;

-- ⚠️ UNCOMMENT THE NEXT 4 LINES TO EXECUTE BULK ASSIGNMENT:
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT u.id, r.id
-- FROM users u, roles r
-- WHERE r.name = 'ROLE_COMPANY' AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id);

-- ================================================================
-- STEP 7: Final verification - Check all users now have roles
-- ================================================================
SELECT 
    u.id,
    u.email,
    COUNT(ur.role_id) as roles_count,
    GROUP_CONCAT(r.name) as roles,
    CASE 
        WHEN COUNT(ur.role_id) = 0 THEN '❌ Still has no roles!'
        ELSE '✅ Has roles'
    END as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email
ORDER BY roles_count ASC, u.id;

-- ================================================================
-- STEP 8: Check specific user's roles (for debugging)
-- ================================================================
SET @check_email = 'your-email@example.com';  -- ⚠️ CHANGE THIS!

SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id,
    u.is_active,
    r.id as role_id,
    r.name as role_name,
    r.description as role_description
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = @check_email;

-- EXPECTED OUTPUT:
-- If role_name is NULL → User has NO roles assigned ❌
-- If role_name = 'ROLE_COMPANY' → User has correct role ✅

-- ================================================================
-- TROUBLESHOOTING TIPS:
-- ================================================================
-- 1. If roles table is empty:
--    Run: SOURCE c:/path/to/ADD_ROLE_COMPANY.sql
--
-- 2. If user_roles table is empty for your user:
--    You MUST uncomment line 66 above to assign the role
--
-- 3. After assigning roles:
--    - Clear browser localStorage: localStorage.clear()
--    - Re-login to get new JWT token with roles
--    - Check identity-service logs for:
--      "🔍 Loading user: <email> | Roles in DB: [ROLE_COMPANY]"
--
-- 4. If token still has roles=[]:
--    - Check identity-service logs for:
--      "❌ USER HAS NO ROLES!"
--    - This means the assignment didn't work
--    - Verify user_roles table has the entry:
--      SELECT * FROM user_roles WHERE user_id = <your_user_id>;
-- ================================================================
