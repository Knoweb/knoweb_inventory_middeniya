package com.inventory.warehouse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "warehouses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(name = "org_id", nullable = false)
    private Long orgId;

    /** Nullable — warehouses without a branch belong directly to the org */
    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "warehouse_type")
    @Enumerated(EnumType.STRING)
    private WarehouseType warehouseType;

    /** Storage capacity in units (e.g. pallets, sq-ft). Nullable. */
    @Column(name = "storage_capacity")
    private Integer storageCapacity;

    /** Free-form JSON or plain text attributes */
    @Column(name = "warehouse_attributes", columnDefinition = "TEXT")
    private String attributes;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private WarehouseStatus status = WarehouseStatus.ACTIVE;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)
            status = WarehouseStatus.ACTIVE;
        if (isActive == null)
            isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum WarehouseType {
        COLD_STORAGE, DRY_STORAGE, RAW_MATERIAL, FINISHED_GOODS, TRANSIT, RETAIL_OUTLET
    }

    public enum WarehouseStatus {
        ACTIVE, INACTIVE, MAINTENANCE
    }
}
