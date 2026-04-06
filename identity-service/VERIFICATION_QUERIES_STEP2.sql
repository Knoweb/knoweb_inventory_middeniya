-- ============================================================
-- STEP 2 VERIFICATION SQL SCRIPT
-- Run this after testing registration to verify data integrity
-- ============================================================

-- ============================================================
-- 1. CHECK IF DATABASES EXIST
-- ============================================================
SHOW DATABASES LIKE '%identity_db%';
SHOW DATABASES LIKE '%subscription_db%';

-- ============================================================
-- 2. VERIFY IDENTITY_DB STRUCTURE
-- ============================================================
USE identity_db;

-- Check users table structure
DESCRIBE users;

-- Count total users
SELECT COUNT(*) AS total_users FROM users;

-- View recent registrations
SELECT 
    id,
    email,
    org_id,
    branch_id,
    is_active,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- 3. VERIFY SUBSCRIPTION_DB STRUCTURE
-- ============================================================
USE subscription_db;

-- Check company_tenant table (should have subscribed_systems column)
DESCRIBE company_tenant;

-- Count total companies
SELECT COUNT(*) AS total_companies FROM company_tenant;

-- View recent companies
SELECT 
    id,
    org_id,
    company_name,
    contact_email,
    subscribed_systems,
    status,
    subscription_start_date,
    subscription_end_date,
    created_at
FROM company_tenant
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- 4. VERIFY DATA CONSISTENCY (JOIN QUERY)
-- ============================================================
-- This joins identity_db and subscription_db to show complete user info
SELECT 
    u.id AS user_id,
    u.email AS user_email,
    u.org_id,
    u.is_active AS user_active,
    u.created_at AS user_created,
    ct.id AS company_id,
    ct.company_name,
    ct.contact_email AS company_email,
    ct.subscribed_systems,
    ct.status AS company_status,
    ct.subscription_start_date,
    ct.subscription_end_date
FROM identity_db.users u
LEFT JOIN subscription_db.company_tenant ct ON u.org_id = ct.org_id
WHERE u.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY u.created_at DESC;

-- ============================================================
-- 5. CHECK JSON COLUMN FUNCTIONALITY
-- ============================================================
-- Test JSON_CONTAINS function (searching for GINUMA users)
SELECT 
    org_id,
    company_name,
    subscribed_systems
FROM company_tenant
WHERE JSON_CONTAINS(subscribed_systems, '"GINUMA"');

-- Test JSON_CONTAINS function (searching for INVENTORY users)
SELECT 
    org_id,
    company_name,
    subscribed_systems
FROM company_tenant
WHERE JSON_CONTAINS(subscribed_systems, '"INVENTORY"');

-- ============================================================
-- 6. VERIFY ORG_ID GENERATION
-- ============================================================
-- Check if org_id is sequential and unique
SELECT 
    org_id,
    company_name,
    contact_email,
    created_at
FROM subscription_db.company_tenant
ORDER BY org_id DESC
LIMIT 20;

-- Check for duplicate org_ids (should return 0 rows)
SELECT 
    org_id,
    COUNT(*) AS count
FROM subscription_db.company_tenant
GROUP BY org_id
HAVING count > 1;

-- ============================================================
-- 7. VERIFY TRIAL SUBSCRIPTIONS
-- ============================================================
-- Find all active trial accounts
SELECT 
    org_id,
    company_name,
    subscription_start_date,
    subscription_end_date,
    DATEDIFF(subscription_end_date, CURDATE()) AS days_remaining,
    CASE 
        WHEN DATEDIFF(subscription_end_date, CURDATE()) > 0 THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END AS trial_status
FROM subscription_db.company_tenant
WHERE status = 'ACTIVE'
ORDER BY subscription_start_date DESC;

-- ============================================================
-- 8. VERIFY PASSWORD HASHING
-- ============================================================
-- Check that passwords are hashed (BCrypt starts with $2a$ or $2b$)
SELECT 
    id,
    email,
    LEFT(password, 10) AS password_hash_prefix,
    CHAR_LENGTH(password) AS password_length
FROM identity_db.users
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Should see:
-- password_hash_prefix: $2a$10$... or $2b$10$...
-- password_length: 60

-- ============================================================
-- 9. CHECK FOR ORPHANED RECORDS
-- ============================================================
-- Find users without company tenant (shouldn't happen)
SELECT 
    u.id,
    u.email,
    u.org_id,
    'No matching company' AS issue
FROM identity_db.users u
LEFT JOIN subscription_db.company_tenant ct ON u.org_id = ct.org_id
WHERE ct.org_id IS NULL;

-- Find company tenants without users (shouldn't happen)
SELECT 
    ct.id,
    ct.org_id,
    ct.company_name,
    'No matching user' AS issue
FROM subscription_db.company_tenant ct
LEFT JOIN identity_db.users u ON ct.org_id = u.org_id
WHERE u.org_id IS NULL;

-- ============================================================
-- 10. SAMPLE TEST DATA QUERIES
-- ============================================================
-- If you registered test users, verify them:

-- Test user: test@ginuma.com
SELECT 'GINUMA USER CHECK' AS test_case;
SELECT * FROM identity_db.users WHERE email = 'test@ginuma.com';
SELECT * FROM subscription_db.company_tenant WHERE contact_email = 'test@ginuma.com';

-- Test user: test@inventory.com  
SELECT 'INVENTORY USER CHECK' AS test_case;
SELECT * FROM identity_db.users WHERE email = 'test@inventory.com';
SELECT * FROM subscription_db.company_tenant WHERE contact_email = 'test@inventory.com';

-- ============================================================
-- 11. PERFORMANCE CHECK
-- ============================================================
-- Check if indexes are present
SHOW INDEX FROM subscription_db.company_tenant;

-- Should see indexes on:
-- - org_id (UNIQUE)
-- - contact_email

-- ============================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================
-- After successful registration:
-- 1. User exists in identity_db.users with hashed password
-- 2. Company exists in subscription_db.company_tenant
-- 3. org_id matches in both tables
-- 4. subscribed_systems contains JSON array: ["GINUMA"] or ["INVENTORY"]
-- 5. status is "ACTIVE"
-- 6. subscription_end_date is 14 days from start_date
-- 7. No orphaned records
-- 8. Passwords are BCrypt hashed (60 characters, starting with $2a$)
-- ============================================================
