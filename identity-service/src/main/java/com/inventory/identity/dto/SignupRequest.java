package com.inventory.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {

    // User Details
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    
    // Organization ID (for assigning user to existing organization)
    private Long orgId;
    
    // System Role (e.g., ROLE_INV_STOCK_KEEPER, ROLE_INV_MOLDING, etc.)
    private String role;

    // Industry Type Selection
    @NotBlank(message = "Industry type is required")
    private String industryType; // PHARMACY, RETAIL, MANUFACTURING, GENERAL, etc.

    // Organization Details
    @NotBlank(message = "Company name is required")
    private String companyName;

    private String contactEmail;
    private String contactPhone;
    private String mobileNumber;
    private String website;
    private String registeredAddress;
    private String factoryAddress;
    private String country;
    private String currency;
    private String registrationNo;
    private String tinNo;
    private boolean isVatRegistered;
    private String vatNo;
    private String companyLogo;
}
