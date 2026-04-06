-- Create all databases for microservices
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS inventory_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS warehouse_db;
CREATE DATABASE IF NOT EXISTS supplier_db;
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS identity_db;
CREATE DATABASE IF NOT EXISTS catalog_db;
CREATE DATABASE IF NOT EXISTS reporting_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON product_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON warehouse_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON supplier_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON user_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON identity_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON catalog_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON reporting_db.* TO 'root'@'%';

FLUSH PRIVILEGES;
