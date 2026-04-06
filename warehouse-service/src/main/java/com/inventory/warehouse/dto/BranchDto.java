package com.inventory.warehouse.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/** Lightweight projection of a Branch returned by the user-service. */
@Data
@NoArgsConstructor
public class BranchDto {
    private Long id;
    private Long orgId;
    private String locationName;
    private String branchCode;
    private String address;
    private String industryType;
    private Boolean isActive;
}
