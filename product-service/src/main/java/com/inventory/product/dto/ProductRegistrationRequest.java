package com.inventory.product.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class ProductRegistrationRequest {
    // Product Details
    private String sku;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String brand;
    private String unit;
    private Integer reorderLevel;
    private Long orgId;
    private String industryType;
    private Map<String, Object> industrySpecificAttributes;

    // Pharmacy-specific fields (if applicable)
    private String genericName;
    private Boolean isPrescriptionRequired;
    private Boolean isRefrigerated;

    // Initial Batch/Stock Details
    private InitialBatchDTO initialBatch;
}
