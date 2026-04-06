package com.inventory.warehouse.dto;

import com.inventory.warehouse.model.Warehouse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponseDto {

    private Long id;
    private String name;
    private String location;
    private Long orgId;

    /** Null when no branch is assigned */
    private Long branchId;
    /**
     * "Main (No Branch)" when branchId is null, otherwise the branch locationName
     */
    private String branchName;

    private Warehouse.WarehouseType warehouseType;
    private Integer storageCapacity;

    /** How many distinct stock records exist for this warehouse */
    private Integer currentUsage;

    private String attributes;
    private Warehouse.WarehouseStatus status;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
