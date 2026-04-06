package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for communication with Ginuma ERP System
 * Sent to: http://ginuma-service:8081/api/tenant/setup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GinumaTenantSetupRequest {

    // Organization/Company information
    private Long orgId; // From subscription service
    private String companyName;
    private String email;
    private String phoneNumber;

    // Admin user information
    private String adminEmail;
    private String adminFirstName;
    private String adminLastName;

    // Company details
    private String address;
    private String city;
    private String country;
    private String industry;

    // Registration & Tax Information (NEW)
    private String registrationNo;
    private String tinNo;
    private String vatNo;

    // Additional company information (NEW)
    private String website;
    private String currency;

    // Database/Schema information
    private String databaseName; // ginuma_db or company-specific
    private String schemaPrefix; // For multi-tenant isolation if needed

    // Subscription information
    private String subscriptionTier; // BASIC, PROFESSIONAL, ENTERPRISE
    private boolean isTrialAccount;
}
