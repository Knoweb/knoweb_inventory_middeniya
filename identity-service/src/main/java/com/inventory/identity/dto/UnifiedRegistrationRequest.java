package com.inventory.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Unified Registration Request DTO
 * Captures all data needed for multi-tenant registration across systems
 * Maps to React frontend Register.jsx form fields
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedRegistrationRequest {
    
    // ========== COMPANY/ORGANIZATION INFORMATION ==========
    
    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 255, message = "Company name must be between 2 and 255 characters")
    private String companyName;
    
    private String companyLogo;  // URL to uploaded logo
    
    @NotBlank(message = "Industry type is required")
    private String industryType;  // GENERAL, PHARMACY, RETAIL, MANUFACTURING, ECOMMERCE
    
    // ========== REGISTRATION & TAX INFORMATION ==========
    
    private String registrationNo;  // Company registration number
    
    private String tinNo;  // Tax Identification Number
    
    private Boolean isVatRegistered;  // VAT registration status
    
    private String vatNo;  // VAT number (required if isVatRegistered = true)
    
    // ========== CONTACT INFORMATION ==========
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Contact phone is required")
    private String contactPhone;  // Primary phone number
    
    private String mobileNumber;  // Mobile/cell phone
    
    private String website;  // Company website URL
    
    // ========== ADDRESS INFORMATION ==========
    
    @NotBlank(message = "Registered address is required")
    private String registeredAddress;  // Legal/registered address
    
    private String factoryAddress;  // Factory/warehouse address
    
    @NotBlank(message = "Country is required")
    private String country;  // Country of operation
    
    @NotBlank(message = "Currency is required")
    private String currency;  // Operating currency (LKR, USD, EUR, etc.)
    
    // ========== USER AUTHENTICATION ==========
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    
    // Confirm password for frontend validation only (optional - may not be sent)
    private String confirmPassword;  // Must match password (validate in service)
    
    // ========== DEFAULT ADMIN USER ==========
    
    private String firstName;  // Default: "Admin"
    
    private String lastName;   // Default: "User"
    
    // ========== SYSTEM SELECTION (CRITICAL) ==========
    
    @NotBlank(message = "System selection is required")
    private String selectedSystem;  // "GINUMA" or "INVENTORY" (uppercase from frontend)
    
    /**
     * Validation helper - Check if Ginuma system
     */
    public boolean isGinumaSystem() {
        return "GINUMA".equalsIgnoreCase(selectedSystem);
    }
    
    /**
     * Validation helper - Check if Inventory system
     */
    public boolean isInventorySystem() {
        return "INVENTORY".equalsIgnoreCase(selectedSystem);
    }
    
    /**
     * Validation helper - Check if PirisaHR system
     */
    public boolean isPirisaHRSystem() {
        return "PIRISAHR".equalsIgnoreCase(selectedSystem);
    }
    
    /**
     * Validation helper - Check if All In One system
     */
    public boolean isAllInOneSystem() {
        return "ALL_IN_ONE".equalsIgnoreCase(selectedSystem);
    }
    
    /**
     * Custom validation - Check if passwords match
     * Only validates if confirmPassword is provided (frontend may omit it)
     */
    public boolean passwordsMatch() {
        if (confirmPassword == null || confirmPassword.isEmpty()) {
            return true;  // Skip validation if confirmPassword not provided
        }
        return password != null && password.equals(confirmPassword);
    }
    
    /**
     * Custom validation - Check if VAT number provided when VAT registered
     */
    public boolean vatValidation() {
        if (Boolean.TRUE.equals(isVatRegistered)) {
            return vatNo != null && !vatNo.trim().isEmpty();
        }
        return true;  // Valid if not VAT registered
    }
}
