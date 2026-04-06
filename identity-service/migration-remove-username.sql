-- Migration to remove username column from users table
-- The username field has been replaced with email as the primary identifier
-- Industry type has been moved to the organizations table

-- Remove username and industry_type columns
ALTER TABLE users DROP COLUMN username, DROP COLUMN industry_type;

-- Ensure email column is properly configured
-- ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;
