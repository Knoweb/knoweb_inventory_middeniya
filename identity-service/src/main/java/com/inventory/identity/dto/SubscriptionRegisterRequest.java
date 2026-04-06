package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for registering a new company with subscription-service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionRegisterRequest {
    private Long orgId;
    private String companyName;
    private String contactEmail;
}
