package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for communication with Inventory User Service
 * Sent to: http://user-service:8086/api/users/org/setup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryOrgSetupRequest {

    // Organization information
    private Long orgId; // From subscription service
    private String organizationName;
    private String contactEmail;
    private String phoneNumber;

    // Admin user information
    private String adminEmail;
    private String adminFirstName;
    private String adminLastName;

    // Branch information (Inventory system uses branches)
    private String primaryBranchName;
    private String primaryBranchCode;

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
    private String factoryAddress; // Manufacturing/warehouse location
    private String currency;

    // Subscription information
    private boolean isTrialAccount;
    private Integer trialDaysRemaining;
}
