package com.inventory.reporting.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAnalytics {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(name = "product_id")
    private Long productId;
    
    @Column(name = "product_sku")
    private String productSku;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "category")
    private String category;
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
    
    @Column(name = "stock_value")
    private BigDecimal stockValue;
    
    @Column(name = "reorder_level")
    private Integer reorderLevel;
    
    @Column(name = "is_low_stock")
    private Boolean isLowStock = false;
    
    @Column(name = "last_movement_date")
    private LocalDate lastMovementDate;
    
    @Column(name = "turnover_rate")
    private BigDecimal turnoverRate;  // Annual turnover
    
    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate = LocalDate.now();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
