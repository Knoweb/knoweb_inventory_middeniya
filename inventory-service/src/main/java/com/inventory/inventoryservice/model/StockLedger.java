package com.inventory.inventoryservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stock Ledger Entity - Tracks cost layers for inventory valuation
 * Each record represents a batch of inventory with its cost basis
 */
@Entity
@Table(name = "stock_ledger", indexes = {
        @Index(name = "idx_product_warehouse", columnList = "product_id,warehouse_id"),
        @Index(name = "idx_org_product", columnList = "org_id,product_id"),
        @Index(name = "idx_transaction_date", columnList = "transaction_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Column(name = "transaction_type", length = 20, nullable = false)
    private String transactionType;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "quantity_in")
    private Integer quantityIn;

    @Column(name = "quantity_out")
    private Integer quantityOut;

    @Column(name = "quantity_balance", nullable = false)
    private Integer quantityBalance;

    @Column(name = "unit_cost", precision = 19, scale = 4, nullable = false)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 19, scale = 2, nullable = false)
    private BigDecimal totalCost;

    @Column(name = "running_balance", precision = 19, scale = 2, nullable = false)
    private BigDecimal runningBalance;

    @Column(name = "weighted_avg_cost", precision = 19, scale = 4)
    private BigDecimal weightedAvgCost;

    @Column(name = "fifo_value", precision = 19, scale = 2)
    private BigDecimal fifoValue;

    @Column(name = "lifo_value", precision = 19, scale = 2)
    private BigDecimal lifoValue;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
