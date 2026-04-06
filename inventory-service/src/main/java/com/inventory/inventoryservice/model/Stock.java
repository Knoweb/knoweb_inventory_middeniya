package com.inventory.inventoryservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(nullable = false)
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity = 0;

    @Column(name = "available_quantity")
    @Min(value = 0, message = "Available quantity cannot be negative")
    private Integer availableQuantity = 0;

    @Column(name = "reserved_quantity")
    @Min(value = 0, message = "Reserved quantity cannot be negative")
    private Integer reservedQuantity = 0;
    
    // ✅ CRITICAL FIX #5: Optimistic locking version for concurrency control
    // NOTE: Initialize to null - Hibernate manages version field initialization
    @Version
    @Column(columnDefinition = "BIGINT DEFAULT 0")
    private Long version;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "reorder_level")
    private Integer reorderLevel;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ✅ NEW: Transient fields for API response (not persisted to DB)
    @Transient
    private String productName;

    @Transient
    private String warehouseName;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
