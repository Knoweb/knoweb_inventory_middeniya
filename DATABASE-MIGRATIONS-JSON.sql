# Database Migration Scripts for JSON Columns

This document provides MySQL migration scripts to add JSON columns for industry-specific attributes.

---

## Prerequisites

- MySQL 8.0 or higher
- Ensure all services are stopped before running migrations
- Backup your database before applying migrations

---

## Migration Scripts

### 1. Product Service Database

```sql
-- Connect to product database
USE product_db;

-- Add JSON column to products table
ALTER TABLE products 
ADD COLUMN industry_type VARCHAR(50) NULL AFTER org_id,
ADD COLUMN industry_specific_attributes JSON NULL AFTER industry_type;

-- Add index for faster filtering by industry type
CREATE INDEX idx_industry_type ON products(industry_type);

-- Add JSON column to batch_info table
ALTER TABLE batch_info
ADD COLUMN batch_attributes JSON NULL AFTER quantity;

-- Add JSON column to product_attributes_pharmacy table
ALTER TABLE product_attributes_pharmacy
ADD COLUMN pharmacy_attributes JSON NULL AFTER product_id;

-- Example: Populate JSON with sample data for testing
UPDATE products 
SET industry_specific_attributes = JSON_OBJECT(
    'sampleAttribute', 'sampleValue'
)
WHERE industry_type IS NOT NULL
LIMIT 0;  -- Set LIMIT > 0 to actually update

-- Verify columns were added
DESCRIBE products;
DESCRIBE batch_info;
DESCRIBE product_attributes_pharmacy;
```

---

### 2. Warehouse Service Database

```sql
-- Connect to warehouse database
USE warehouse_db;

-- Add JSON column to warehouses table
ALTER TABLE warehouses
ADD COLUMN warehouse_attributes JSON NULL AFTER storage_capacity;

-- Example: Add warehouse-specific attributes
-- For cold storage warehouses
UPDATE warehouses 
SET warehouse_attributes = JSON_OBJECT(
    'temperatureRange', '-20°C to 5°C',
    'humidityControl', true,
    'temperatureMonitoring', '24/7'
)
WHERE warehouse_type = 'COLD_STORAGE';

-- For dry storage warehouses
UPDATE warehouses 
SET warehouse_attributes = JSON_OBJECT(
    'climateControlled', false,
    'stackingHeight', '6m',
    'floorLoadCapacity', '5000kg/m2'
)
WHERE warehouse_type = 'DRY_STORAGE';

-- Verify column was added
DESCRIBE warehouses;
```

---

## Sample Data Insertion

### Insert Pharmacy Product with JSON Attributes

```sql
USE product_db;

INSERT INTO products (
    sku, name, description, price, category, brand, 
    org_id, industry_type, industry_specific_attributes,
    is_active, created_at, updated_at
) VALUES (
    'PHARM-TEST001',
    'Aspirin 500mg',
    'Pain reliever and fever reducer',
    12.99,
    'OTC_DRUGS',
    'Generic',
    1,
    'PHARMACY',
    JSON_OBJECT(
        'activeIngredient', 'Acetylsalicylic Acid',
        'strength', '500mg',
        'dosageForm', 'Tablet',
        'prescriptionRequired', false,
        'controlledSubstance', false,
        'ndc', '12345-678-90',
        'route', 'Oral',
        'storageConditions', 'Room Temperature'
    ),
    true,
    NOW(),
    NOW()
);
```

### Insert Retail Product with JSON Attributes

```sql
INSERT INTO products (
    sku, name, description, price, category, brand,
    org_id, industry_type, industry_specific_attributes,
    is_active, created_at, updated_at
) VALUES (
    'RETAIL-TEST001',
    'Blue Cotton T-Shirt',
    'Comfortable cotton t-shirt',
    29.99,
    'CLOTHING',
    'MyBrand',
    1,
    'RETAIL',
    JSON_OBJECT(
        'size', 'M',
        'color', 'Blue',
        'material', 'Cotton',
        'season', 'All Season',
        'gender', 'Unisex',
        'careInstructions', 'Machine wash cold',
        'weight', '0.2kg'
    ),
    true,
    NOW(),
    NOW()
);
```

### Insert Manufacturing Product with JSON Attributes

```sql
INSERT INTO products (
    sku, name, description, price, category, brand,
    org_id, industry_type, industry_specific_attributes,
    is_active, created_at, updated_at
) VALUES (
    'MFG-TEST001',
    'Steel Component XYZ',
    'Industrial steel component',
    45.00,
    'COMPONENTS',
    'SteelCo',
    1,
    'MANUFACTURING',
    JSON_OBJECT(
        'partNumber', 'COMP-001',
        'specifications', 'Grade A Steel',
        'tolerance', '±0.1mm',
        'leadTime', '7 days',
        'moq', 100,
        'hazardous', false,
        'certifications', JSON_ARRAY('ISO 9001', 'CE'),
        'weight', '2.5kg'
    ),
    true,
    NOW(),
    NOW()
);
```

### Insert Batch with JSON Attributes

```sql
INSERT INTO batch_info (
    product_id, batch_number, manufacturing_date, expiry_date,
    quantity, batch_attributes, created_at, updated_at
) VALUES (
    1,
    'LOT-2026-001',
    '2026-01-15',
    '2028-01-15',
    1000,
    JSON_OBJECT(
        'lotNumber', 'LOT-2026-001',
        'sterile', true,
        'coldChainRequired', false,
        'storageTemp', 'Room Temperature',
        'inspectionDate', '2026-01-16',
        'qualityGrade', 'A',
        'regulatoryApproval', 'FDA-2026-001'
    ),
    NOW(),
    NOW()
);
```

---

## Querying JSON Columns

### Basic JSON Queries

```sql
-- Find all prescription-required products
SELECT id, name, sku
FROM products
WHERE JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired') = true;

-- Find products with specific strength
SELECT id, name, sku,
       JSON_EXTRACT(industry_specific_attributes, '$.strength') as strength
FROM products
WHERE JSON_EXTRACT(industry_specific_attributes, '$.strength') = '500mg';

-- Find retail products in size Medium
SELECT id, name, sku,
       JSON_EXTRACT(industry_specific_attributes, '$.size') as size
FROM products
WHERE industry_type = 'RETAIL'
  AND JSON_EXTRACT(industry_specific_attributes, '$.size') = 'M';

-- Find all controlled substances
SELECT id, name, sku
FROM products
WHERE industry_type = 'PHARMACY'
  AND JSON_EXTRACT(industry_specific_attributes, '$.controlledSubstance') = true;
```

### Complex JSON Queries

```sql
-- Find products by multiple JSON attributes
SELECT id, name, sku,
       JSON_EXTRACT(industry_specific_attributes, '$.dosageForm') as dosage_form,
       JSON_EXTRACT(industry_specific_attributes, '$.strength') as strength
FROM products
WHERE industry_type = 'PHARMACY'
  AND JSON_EXTRACT(industry_specific_attributes, '$.dosageForm') = 'Tablet'
  AND JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired') = false;

-- Find warehouses with temperature control
SELECT id, name, location,
       JSON_EXTRACT(warehouse_attributes, '$.temperatureRange') as temp_range
FROM warehouses
WHERE JSON_EXTRACT(warehouse_attributes, '$.humidityControl') = true;

-- Find batches requiring cold chain
SELECT bi.id, bi.batch_number, p.name,
       JSON_EXTRACT(bi.batch_attributes, '$.coldChainRequired') as cold_chain
FROM batch_info bi
JOIN products p ON bi.product_id = p.id
WHERE JSON_EXTRACT(bi.batch_attributes, '$.coldChainRequired') = true;
```

### JSON Array Queries

```sql
-- Find products with specific certification (in JSON array)
SELECT id, name, sku,
       JSON_EXTRACT(industry_specific_attributes, '$.certifications') as certs
FROM products
WHERE JSON_CONTAINS(
    industry_specific_attributes,
    '"ISO 9001"',
    '$.certifications'
);

-- Get all certifications as separate rows
SELECT p.id, p.name, 
       cert.certification
FROM products p
CROSS JOIN JSON_TABLE(
    industry_specific_attributes,
    '$.certifications[*]' COLUMNS (
        certification VARCHAR(100) PATH '$'
    )
) cert
WHERE industry_type = 'MANUFACTURING';
```

---

## Performance Optimization

### Create Generated Columns and Indexes

```sql
USE product_db;

-- Create generated column for prescription_required
ALTER TABLE products
ADD COLUMN prescription_required BOOLEAN
GENERATED ALWAYS AS (
    JSON_EXTRACT(industry_specific_attributes, '$.prescriptionRequired')
) STORED;

-- Create index on generated column
CREATE INDEX idx_prescription_required ON products(prescription_required);

-- Create generated column for product size
ALTER TABLE products
ADD COLUMN product_size VARCHAR(10)
GENERATED ALWAYS AS (
    JSON_UNQUOTE(JSON_EXTRACT(industry_specific_attributes, '$.size'))
) STORED;

CREATE INDEX idx_product_size ON products(product_size);

-- Create generated column for dosage form
ALTER TABLE products
ADD COLUMN dosage_form VARCHAR(50)
GENERATED ALWAYS AS (
    JSON_UNQUOTE(JSON_EXTRACT(industry_specific_attributes, '$.dosageForm'))
) STORED;

CREATE INDEX idx_dosage_form ON products(dosage_form);
```

### Query Using Generated Columns

```sql
-- Much faster than JSON_EXTRACT in WHERE clause
SELECT id, name, sku, prescription_required
FROM products
WHERE prescription_required = true;

-- Filter by size using generated column
SELECT id, name, sku, product_size
FROM products
WHERE product_size = 'M';
```

---

## Data Migration from Separate Tables

If you have existing separate tables for industry-specific attributes, migrate them to JSON:

```sql
-- Example: Migrate pharmacy attributes table to JSON
UPDATE products p
INNER JOIN product_attributes_pharmacy pap ON p.id = pap.product_id
SET p.industry_specific_attributes = JSON_OBJECT(
    'activeIngredient', pap.active_ingredient,
    'strength', pap.strength,
    'dosageForm', pap.dosage_form,
    'prescriptionRequired', pap.prescription_required,
    'controlledSubstance', pap.controlled_substance
)
WHERE p.industry_type = 'PHARMACY';

-- Verify migration
SELECT id, name, industry_specific_attributes
FROM products
WHERE industry_type = 'PHARMACY'
LIMIT 5;
```

---

## Rollback Scripts

In case you need to revert the changes:

```sql
-- Product Service Database
USE product_db;

ALTER TABLE products 
DROP COLUMN industry_specific_attributes,
DROP COLUMN industry_type;

ALTER TABLE batch_info
DROP COLUMN batch_attributes;

ALTER TABLE product_attributes_pharmacy
DROP COLUMN pharmacy_attributes;

-- Warehouse Service Database
USE warehouse_db;

ALTER TABLE warehouses
DROP COLUMN warehouse_attributes;

-- Drop generated columns and indexes (if created)
USE product_db;

ALTER TABLE products
DROP COLUMN prescription_required,
DROP COLUMN product_size,
DROP COLUMN dosage_form;

DROP INDEX idx_prescription_required ON products;
DROP INDEX idx_product_size ON products;
DROP INDEX idx_dosage_form ON products;
DROP INDEX idx_industry_type ON products;
```

---

## Verification Queries

After running migrations, verify the changes:

```sql
-- Check column structure
USE product_db;
DESCRIBE products;
DESCRIBE batch_info;
DESCRIBE product_attributes_pharmacy;

USE warehouse_db;
DESCRIBE warehouses;

-- Check sample data
USE product_db;
SELECT id, name, industry_type, industry_specific_attributes
FROM products
LIMIT 10;

-- Validate JSON structure
SELECT id, name,
       JSON_VALID(industry_specific_attributes) as is_valid_json
FROM products
WHERE industry_specific_attributes IS NOT NULL;

-- Check JSON keys in attributes
SELECT DISTINCT JSON_KEYS(industry_specific_attributes) as attribute_keys
FROM products
WHERE industry_specific_attributes IS NOT NULL;
```

---

## Best Practices

1. **Always backup** before running migrations
2. **Test in development** environment first
3. **Run during maintenance window** for production
4. **Monitor performance** after adding JSON columns
5. **Create generated columns** for frequently queried JSON paths
6. **Set appropriate indexes** on generated columns
7. **Validate JSON structure** after bulk inserts/updates

---

## Troubleshooting

### Issue: JSON column shows NULL after migration
**Solution:** Check if source data exists and migration query is correct

### Issue: JSON_EXTRACT returns NULL
**Solution:** Verify JSON path syntax: `$.attributeName` (case-sensitive)

### Issue: Performance degradation on JSON queries
**Solution:** Create generated columns and indexes for frequently queried paths

### Issue: Invalid JSON error
**Solution:** Validate JSON before insert using `JSON_VALID()` function

---

## Example Application Usage

After running migrations, the application can immediately start using JSON columns:

```bash
# Create product with JSON attributes
curl -X POST http://localhost:8080/api/products/templates/create?orgId=1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ibuprofen 400mg",
    "category": "OTC_DRUGS",
    "basePrice": 8.99,
    "industryType": "PHARMACY",
    "industrySpecificAttributes": {
      "activeIngredient": "Ibuprofen",
      "strength": "400mg",
      "dosageForm": "Tablet",
      "prescriptionRequired": false
    }
  }'

# Retrieve product with JSON attributes
curl http://localhost:8080/api/products/1
```

---

**Last Updated:** February 14, 2026  
**Migration Version:** 1.0  
**Compatible with:** MySQL 8.0+
