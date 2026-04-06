package com.inventory.product.factory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;

/**
 * Product Template DTO for Factory Pattern
 * Contains industry-specific product configurations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductTemplate {
    private String name;
    private String category;
    private String description;
    private BigDecimal basePrice;
    private String industryType;
    private Map<String, Object> industrySpecificAttributes;
    private String[] requiredFields;
    private String[] optionalFields;
    private Map<String, String> validationRules;
}
