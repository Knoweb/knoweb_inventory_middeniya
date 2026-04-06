package com.inventory.product.model;

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
@Table(name = "products", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "org_id", "sku" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Column(length = 50)
    private String category;

    @Column(length = 50)
    private String brand;

    @Column(length = 20)
    private String unit;

    @Column(name = "reorder_level")
    private Integer reorderLevel;

    @Column(name = "vendor_level")
    private String vendorLevel;

    @Column(name = "my_op_hand")
    private String myOpHand;

    @Column(name = "warehouse_id", length = 100)
    private String warehouseId;

    @Column(name = "org_id")
    private Long orgId;

    @Column(name = "industry_type", length = 50)
    private String industryType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "industry_specific_attributes", columnDefinition = "JSON")
    private Map<String, Object> industrySpecificAttributes;

    @Column(name = "is_active")
    private Boolean isActive = true;

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
