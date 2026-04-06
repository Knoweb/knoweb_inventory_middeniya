package com.inventory.reporting.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesAnalytics {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(name = "order_id")
    private Long orderId;
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    
    @Column(name = "total_items")
    private Integer totalItems;
    
    @Column(name = "order_status")
    private String orderStatus;
    
    @Column(name = "customer_id")
    private Long customerId;
    
    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;
    
    @Column(name = "month_year")
    private String monthYear;  // Format: 2026-02
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
