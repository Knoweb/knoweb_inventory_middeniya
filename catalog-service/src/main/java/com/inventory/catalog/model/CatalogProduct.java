package com.inventory.catalog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "catalog_products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CatalogProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String sku;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    private String category;
    private String brand;
    
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "industry_type", nullable = false)
    private String industryType;  // PHARMACY, RETAIL, MANUFACTURING
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "JSON")
    private Map<String, Object> attributes;  // Industry-specific attributes
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "images", columnDefinition = "JSON")
    private Map<String, Object> images;  // Product images (URLs, thumbnails)
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSON")
    private Map<String, Object> tags;  // Search tags and metadata
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_featured")
    private Boolean isFeatured = false;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
