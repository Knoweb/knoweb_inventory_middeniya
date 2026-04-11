-- Insert Organization Data
INSERT INTO organizations (
    id, 
    address, 
    contact_email, 
    contact_phone, 
    created_at, 
    industry_type, 
    is_active, 
    name, 
    tax_id, 
    tenant_id, 
    updated_at
) VALUES (
    16, 
    'No.43/C, Maharuppa Watta, Karamatiya, Kirama, Sri Lanka.', 
    'aruna@randiyaengineering.com', 
    '0717807847', 
    '2026-03-27 06:30:35.413575', 
    'MANUFACTURING', 
    1, 
    'Randiya Engineering (PVT)LTD', 
    '174996890', 
    '87b8dd04-52ad-4fc3-98fa-afd8d985ff82', 
    '2026-03-27 06:30:35.413584'
);

-- Insert User Data
INSERT INTO users (
    id, 
    branch_id, 
    created_at, 
    email, 
    first_name, 
    is_active, 
    is_email_verified, 
    last_login, 
    last_name, 
    org_id, 
    password, 
    phone_number, 
    updated_at
) VALUES (
    17, 
    NULL, 
    '2026-03-27 06:30:35.524511', 
    'aruna@randiyaengineering.com', 
    'Admin', 
    1, 
    0, 
    '2026-04-09 14:02:07.247516', 
    'User', 
    16, 
    '$2a$10$nsQ8K7cAi1oNIPRUYBUch.xbJ6psIdH3mLofj2UeYASowkhlU01G.', 
    '0717807847', 
    '2026-04-09 14:02:07.533756'
);
