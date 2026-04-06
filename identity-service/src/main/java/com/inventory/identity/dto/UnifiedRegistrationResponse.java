package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Unified Registration Response DTO
 * Returns comprehensive information after successful registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedRegistrationResponse {
    
    // Success indicator
    private boolean success;
    private String message;
    
    // User information
    private Long userId;
    private String email;
    private String fullName;
    
    // Organization information
    private Long orgId;
    private String orgName;
    private Long tenantId;
    
    // Branch information (if applicable)
    private Long branchId;
    private String branchName;
    
    // System access information
    private List<String> subscribedSystems;
    private String registeredSystem;
    
    // Account status
    private String accountStatus;  // ACTIVE, PENDING, TRIAL
    private boolean isTrialAccount;
    private Integer trialDaysRemaining;
    
    // Subscription information
    private LocalDateTime subscriptionStartDate;
    private LocalDateTime subscriptionEndDate;
    
    // Next steps
    private String redirectUrl;  // URL to redirect user after registration
    private String nextAction;   // LOGIN, VERIFY_EMAIL, COMPLETE_SETUP
    
    // System-specific IDs for tracking
    private Long identityServiceUserId;
    private Long subscriptionServiceCompanyId;
    private Long systemSpecificOrgId;  // ID in Ginuma or Inventory system
    
    // Timestamps
    private LocalDateTime registeredAt;
    
    /**
     * Factory method for successful registration
     */
    public static UnifiedRegistrationResponse success(
            Long userId, 
            String email, 
            String fullName,
            Long orgId,
            String orgName,
            String system,
            String redirectUrl
    ) {
        return UnifiedRegistrationResponse.builder()
                .success(true)
                .message("Registration completed successfully")
                .userId(userId)
                .email(email)
                .fullName(fullName)
                .orgId(orgId)
                .orgName(orgName)
                .registeredSystem(system)
                .accountStatus("ACTIVE")
                .redirectUrl(redirectUrl)
                .nextAction("LOGIN")
                .registeredAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Factory method for failed registration
     */
    public static UnifiedRegistrationResponse failure(String errorMessage) {
        return UnifiedRegistrationResponse.builder()
                .success(false)
                .message(errorMessage)
                .registeredAt(LocalDateTime.now())
                .build();
    }
}
