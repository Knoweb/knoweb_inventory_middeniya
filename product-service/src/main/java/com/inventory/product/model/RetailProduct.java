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
 * Retail-specific product attributes
 * Features: Size/color variants, seasonal tracking
 */
@Entity
@Table(name = "retail_products", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_parent_sku", columnList = "parent_sku"),
    @Index(name = "idx_season", columnList = "season")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetailProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    // Variant Management
    @Column(name = "parent_sku", length = 100)
    private String parentSku; // For variant grouping
    
    @Column(name = "variant_sku", unique = true, length = 100)
    private String variantSku;
    
    @Column(name = "is_master_product")
    private Boolean isMasterProduct = false;
    
    // Size Variants
    @Column(name = "size_category", length = 50)
    private String sizeCategory; // APPAREL, FOOTWEAR, GENERAL
    
    @Column(name = "size_value", length = 50)
    private String sizeValue; // XS, S, M, L, XL, 2XL, 3XL
    
    @Column(name = "size_numeric")
    private Integer sizeNumeric; // 28, 30, 32 for pants; 6, 7, 8 for shoes
    
    @Column(name = "size_chart", columnDefinition = "TEXT")
    private String sizeChart; // Size chart reference
    
    // Color Variants
    @Column(name = "color_name", length = 100)
    private String colorName;
    
    @Column(name = "color_code", length = 20)
    private String colorCode; // HEX color code
    
    @Column(name = "color_family", length = 50)
    private String colorFamily; // Red, Blue, Green, etc.
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "color_images", columnDefinition = "JSON")
    private List<String> colorImages; // URLs to product images for this color
    
    // Style Variants
    @Column(name = "style_name", length = 100)
    private String styleName;
    
    @Column(name = "pattern", length = 50)
    private String pattern; // Solid, Striped, Checkered, Floral
    
    @Column(name = "material", length = 100)
    private String material; // Cotton, Polyester, Leather, etc.
    
    @Column(name = "fabric_weight", length = 50)
    private String fabricWeight;
    
    // Seasonal Tracking
    @Column(name = "season", length = 50)
    private String season; // SPRING, SUMMER, FALL, WINTER, ALL_SEASON
    
    @Column(name = "season_year")
    private Integer seasonYear;
    
    @Column(name = "collection_name", length = 100)
    private String collectionName;
    
    @Column(name = "is_seasonal")
    private Boolean isSeasonal = false;
    
    @Column(name = "launch_date")
    private LocalDateTime launchDate;
    
    @Column(name = "end_of_season_date")
    private LocalDateTime endOfSeasonDate;
    
    // Pricing & Promotions
    @Column(name = "msrp", precision = 15, scale = 2)
    private BigDecimal msrp; // Manufacturer Suggested Retail Price
    
    @Column(name = "sale_price", precision = 15, scale = 2)
    private BigDecimal salePrice;
    
    @Column(name = "is_on_sale")
    private Boolean isOnSale = false;
    
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;
    
    @Column(name = "promotion_code", length = 100)
    private String promotionCode;
    
    @Column(name = "promotion_start_date")
    private LocalDateTime promotionStartDate;
    
    @Column(name = "promotion_end_date")
    private LocalDateTime promotionEndDate;
    
    // Inventory Management
    @Column(name = "is_available_online")
    private Boolean isAvailableOnline = true;
    
    @Column(name = "is_available_in_store")
    private Boolean isAvailableInStore = true;
    
    @Column(name = "allow_backorder")
    private Boolean allowBackorder = false;
    
    @Column(name = "min_order_quantity")
    private Integer minOrderQuantity = 1;
    
    @Column(name = "max_order_quantity")
    private Integer maxOrderQuantity;
    
    // Display Preferences
    @Column(name = "display_order")
    private Integer displayOrder;
    
    @Column(name = "is_featured")
    private Boolean isFeatured = false;
    
    @Column(name = "is_new_arrival")
    private Boolean isNewArrival = false;
    
    @Column(name = "is_bestseller")
    private Boolean isBestseller = false;
    
    @Column(name = "is_clearance")
    private Boolean isClearance = false;
    
    // Product Attributes
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_attributes", columnDefinition = "JSON")
    private Map<String, Object> customAttributes;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "JSON")
    private List<String> tags;
    
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
        updateSeasonalStatus();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateSeasonalStatus();
    }
    
    private void updateSeasonalStatus() {
        if (endOfSeasonDate != null) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isAfter(endOfSeasonDate)) {
                isClearance = true;
            }
        }
    }
}
