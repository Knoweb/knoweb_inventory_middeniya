package com.inventory.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "product_attributes_pharmacy")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributePharmacy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pharmacy_attributes", columnDefinition = "JSON")
    private Map<String, Object> pharmacyAttributes;
    
    @Column(name = "batch_info", length = 100)
    private String batchInfo;
    
    @Column(name = "overrefined_substrates", columnDefinition = "TEXT")
    private String overrefinedSubstrates;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
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
