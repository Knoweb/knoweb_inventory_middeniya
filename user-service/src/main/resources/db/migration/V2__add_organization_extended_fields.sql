-- Add extended fields to organizations table for comprehensive company registration

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS tin_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vat_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS registered_address VARCHAR(500),
ADD COLUMN IF NOT EXISTS factory_address VARCHAR(500),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_registration_no ON organizations(registration_no);
CREATE INDEX IF NOT EXISTS idx_organizations_vat_no ON organizations(vat_no);
