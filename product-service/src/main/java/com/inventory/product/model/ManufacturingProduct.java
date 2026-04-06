package com.inventory.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Manufacturing-specific product attributes
 * Features: Raw materials tracking, WIP (Work-in-Progress) tracking
 */
@Entity
@Table(name = "manufacturing_products", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_product_type", columnList = "product_type"),
    @Index(name = "idx_wip_status", columnList = "wip_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManufacturingProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    // Product Classification
    @Column(name = "product_type", nullable = false, length = 50)
    private String productType; // RAW_MATERIAL, WIP, FINISHED_GOOD, COMPONENT
    
    @Column(name = "material_code", length = 100)
    private String materialCode;
    
    @Column(name = "part_number", length = 100)
    private String partNumber;
    
    @Column(name = "revision", length = 50)
    private String revision;
    
    // Raw Material Tracking
    @Column(name = "material_grade", length = 100)
    private String materialGrade;
    
    @Column(name = "material_specification", columnDefinition = "TEXT")
    private String materialSpecification;
    
    @Column(name = "supplier_material_code", length = 100)
    private String supplierMaterialCode;
    
    @Column(name = "lot_number", length = 100)
    private String lotNumber;
    
    @Column(name = "heat_number", length = 100)
    private String heatNumber; // For metals
    
    @Column(name = "certificate_number", length = 100)
    private String certificateNumber; // Material test certificate
    
    // Bill of Materials (BOM)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bom_items", columnDefinition = "JSON")
    private List<BomItem> bomItems;
    
    @Column(name = "bom_level")
    private Integer bomLevel; // Level in BOM hierarchy
    
    @Column(name = "parent_product_id")
    private Long parentProductId;
    
    // Work-in-Progress (WIP) Tracking
    @Column(name = "wip_status", length = 50)
    private String wipStatus; // QUEUED, IN_PROGRESS, ON_HOLD, COMPLETED, SCRAPPED
    
    @Column(name = "work_order_number", length = 100)
    private String workOrderNumber;
    
    @Column(name = "production_line", length = 100)
    private String productionLine;
    
    @Column(name = "operation_sequence")
    private Integer operationSequence;
    
    @Column(name = "current_operation", length = 200)
    private String currentOperation;
    
    @Column(name = "next_operation", length = 200)
    private String nextOperation;
    
    @Column(name = "completion_percentage", precision = 5, scale = 2)
    private BigDecimal completionPercentage;
    
    @Column(name = "wip_start_date")
    private LocalDateTime wipStartDate;
    
    @Column(name = "wip_completion_date")
    private LocalDateTime wipCompletionDate;
    
    @Column(name = "estimated_completion_date")
    private LocalDateTime estimatedCompletionDate;
    
    // Production Costs
    @Column(name = "material_cost", precision = 15, scale = 2)
    private BigDecimal materialCost;
    
    @Column(name = "labor_cost", precision = 15, scale = 2)
    private BigDecimal laborCost;
    
    @Column(name = "overhead_cost", precision = 15, scale = 2)
    private BigDecimal overheadCost;
    
    @Column(name = "total_manufacturing_cost", precision = 15, scale = 2)
    private BigDecimal totalManufacturingCost;
    
    @Column(name = "scrap_cost", precision = 15, scale = 2)
    private BigDecimal scrapCost;
    
    // Quality Control
    @Column(name = "quality_grade", length = 50)
    private String qualityGrade; // A, B, C, REJECT
    
    @Column(name = "inspection_status", length = 50)
    private String inspectionStatus; // PENDING, PASSED, FAILED, CONDITIONAL
    
    @Column(name = "inspection_date")
    private LocalDateTime inspectionDate;
    
    @Column(name = "inspector_name", length = 100)
    private String inspectorName;
    
    @Column(name = "defect_count")
    private Integer defectCount;
    
    @Column(name = "defect_description", columnDefinition = "TEXT")
    private String defectDescription;
    
    @Column(name = "rework_required")
    private Boolean reworkRequired = false;
    
    @Column(name = "rework_count")
    private Integer reworkCount = 0;
    
    // Manufacturing Specifications
    @Column(name = "machine_id", length = 100)
    private String machineId;
    
    @Column(name = "tool_id", length = 100)
    private String toolId;
    
    @Column(name = "cycle_time_minutes")
    private Integer cycleTimeMinutes;
    
    @Column(name = "setup_time_minutes")
    private Integer setupTimeMinutes;
    
    @Column(name = "standard_labor_hours", precision = 8, scale = 2)
    private BigDecimal standardLaborHours;
    
    @Column(name = "actual_labor_hours", precision = 8, scale = 2)
    private BigDecimal actualLaborHours;
    
    // Inventory Control
    @Column(name = "min_stock_level")
    private Integer minStockLevel;
    
    @Column(name = "max_stock_level")
    private Integer maxStockLevel;
    
    @Column(name = "safety_stock")
    private Integer safetyStock;
    
    @Column(name = "lead_time_days")
    private Integer leadTimeDays;
    
    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;
    
    // Tracking & Traceability
    @Column(name = "serial_number_required")
    private Boolean serialNumberRequired = false;
    
    @Column(name = "batch_tracking_required")
    private Boolean batchTrackingRequired = false;
    
    @Column(name = "traceability_level", length = 50)
    private String traceabilityLevel; // FULL, PARTIAL, NONE
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "traceability_data", columnDefinition = "JSON")
    private Map<String, Object> traceabilityData;
    
    // Additional Attributes
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "manufacturing_attributes", columnDefinition = "JSON")
    private Map<String, Object> manufacturingAttributes;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    // Audit
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateTotalCost();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateTotalCost();
    }
    
    private void calculateTotalCost() {
        BigDecimal total = BigDecimal.ZERO;
        if (materialCost != null) total = total.add(materialCost);
        if (laborCost != null) total = total.add(laborCost);
        if (overheadCost != null) total = total.add(overheadCost);
        if (scrapCost != null) total = total.add(scrapCost);
        totalManufacturingCost = total;
    }
    
    /**
     * Inner class for BOM items
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BomItem {
        private Long componentProductId;
        private String componentSku;
        private String componentName;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitCost;
        private Boolean isOptional;
    }
}
