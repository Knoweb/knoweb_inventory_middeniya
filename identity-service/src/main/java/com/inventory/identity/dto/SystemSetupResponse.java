package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic response from system-specific setup endpoints
 * Received from both Ginuma and Inventory systems
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetupResponse {

    private boolean success;
    private String message;

    // System-specific organization/tenant ID
    private Long orgId;
    private String tenantId;
    private Long companyId;

    // Branch ID (primarily for Inventory system)
    private Long branchId;

    // User ID in the target system
    private Long userId;

    // Database/Schema information
    private String databaseName;
    private String schemaName;

    // Error information
    private String errorCode;
    private String errorDetails;
}
