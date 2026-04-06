package com.inventory.identity.model;

public enum RoleName {
    ROLE_SUPER_ADMIN,      // System-wide admin
    ROLE_ORG_ADMIN,        // Organization admin
    ROLE_COMPANY,          // Company/Organization owner (for multi-tenant SaaS)
    ROLE_MANAGER,          // Branch/Department manager
    ROLE_WAREHOUSE_STAFF,  // Warehouse operations
    ROLE_SALES_STAFF,      // Sales and orders
    ROLE_PROCUREMENT,      // Supplier and purchasing
    ROLE_ACCOUNTANT,       // Financial reports
    ROLE_AUDITOR,          // Read-only audit access
    ROLE_USER              // Basic user
}
