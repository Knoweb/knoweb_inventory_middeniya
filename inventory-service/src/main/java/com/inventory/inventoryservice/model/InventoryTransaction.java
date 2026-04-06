package com.inventory.inventoryservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "warehouse_id")
    private Long warehouseId;
    
    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TransactionType type;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;
    
    @Column(name = "total_value", precision = 19, scale = 2)
    private BigDecimal totalValue;
    
    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;
    
    @Column(name = "reference_id", length = 100)
    private String referenceId;
    
    @Column(name = "to_address", length = 255)
    private String toAddress;

    @Column(name = "to_warehouse_id")
    private Long toWarehouseId;

    @Column(name = "movement_status", length = 50)
    private String movementStatus;
    
    @Column(name = "expected_status", columnDefinition = "TEXT")
    private String expectedStatus;
    
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "reason_code", length = 50)
    private String reasonCode;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ✅ NEW: Transient fields for API response (not persisted to DB)
    @Transient
    private String productName;

    @Transient
    private String warehouseName;

    @Transient
    private String toWarehouseName;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionDate == null) {
            transactionDate = LocalDateTime.now();
        }
        if (unitPrice != null && quantity != null && totalValue == null) {
            totalValue = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
    
    public enum TransactionType {
        IN, OUT, ADJUSTMENT, TRANSFER, RETURN
    }
}
