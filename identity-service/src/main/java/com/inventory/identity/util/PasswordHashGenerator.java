package com.inventory.identity.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hashes
 * Run this class to generate a hash for your password
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Generate hash for "Admin@123"
        String password = "Admin@123";
        String hash = encoder.encode(password);
        
        System.out.println("==============================================");
        System.out.println("Password Hash Generator");
        System.out.println("==============================================");
        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println("==============================================");
        System.out.println("\nSQL to create super admin user:");
        System.out.println("USE identity_db;");
        System.out.println("INSERT INTO users (email, password, org_id, branch_id, is_active, created_at, updated_at)");
        System.out.println("VALUES (");
        System.out.println("  'superadmin@erp.com',");
        System.out.println("  '" + hash + "',");
        System.out.println("  NULL, NULL, true, NOW(), NOW()");
        System.out.println(");");
        System.out.println("\nOr update existing user:");
        System.out.println("UPDATE users SET password = '" + hash + "' WHERE email = 'superadmin@erp.com';");
        System.out.println("==============================================");
        
        // Verify the hash works
        boolean matches = encoder.matches(password, hash);
        System.out.println("\nVerification: " + (matches ? "✓ Hash is valid" : "✗ Hash is invalid"));
    }
}
