package com.inventory.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Pharmacy-specific product attributes
 * Features: Batch tracking, expiry dates, prescription-only flags
 */
@Entity
@Table(name = "pharmacy_products", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_batch_number", columnList = "batch_number"),
    @Index(name = "idx_expiry_date", columnList = "expiry_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    // Batch Tracking
    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;
    
    @Column(name = "batch_size")
    private Integer batchSize;
    
    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;
    
    // Expiry Date Management
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;
    
    @Column(name = "storage_conditions", length = 500)
    private String storageConditions;
    
    // Prescription Management
    @Column(name = "is_prescription_required", nullable = false)
    private Boolean isPrescriptionRequired = false;
    
    @Column(name = "prescription_type", length = 50)
    private String prescriptionType; // RX, OTC, CONTROLLED
    
    @Column(name = "controlled_substance_schedule", length = 10)
    private String controlledSubstanceSchedule; // I, II, III, IV, V
    
    // Drug Information
    @Column(name = "active_ingredient", length = 200)
    private String activeIngredient;
    
    @Column(name = "strength", length = 100)
    private String strength;
    
    @Column(name = "dosage_form", length = 100)
    private String dosageForm; // Tablet, Capsule, Syrup, Injection
    
    @Column(name = "ndc_code", length = 50)
    private String ndcCode; // National Drug Code
    
    @Column(name = "drug_class", length = 100)
    private String drugClass;
    
    // Safety and Compliance
    @Column(name = "requires_refrigeration")
    private Boolean requiresRefrigeration = false;
    
    @Column(name = "temperature_min")
    private Double temperatureMin;
    
    @Column(name = "temperature_max")
    private Double temperatureMax;
    
    @Column(name = "warning_labels", columnDefinition = "TEXT")
    private String warningLabels;
    
    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;
    
    @Column(name = "interactions", columnDefinition = "TEXT")
    private String interactions;
    
    // Status
    @Column(name = "is_expired")
    private Boolean isExpired = false;
    
    @Column(name = "days_until_expiry")
    private Integer daysUntilExpiry;
    
    @Column(name = "is_recalled")
    private Boolean isRecalled = false;
    
    @Column(name = "recall_date")
    private LocalDate recallDate;
    
    @Column(name = "recall_reason", columnDefinition = "TEXT")
    private String recallReason;
    
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
        updateExpiryStatus();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateExpiryStatus();
    }
    
    private void updateExpiryStatus() {
        if (expiryDate != null) {
            LocalDate today = LocalDate.now();
            daysUntilExpiry = (int) java.time.temporal.ChronoUnit.DAYS.between(today, expiryDate);
            isExpired = expiryDate.isBefore(today);
        }
    }
}
