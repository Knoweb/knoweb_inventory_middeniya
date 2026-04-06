package com.inventory.inventoryservice.dto;

import lombok.Data;

@Data
public class ProductDto {
    private Long id;
    private Integer reorderLevel;
    private String name;
    private String sku;
    private String category;
    private java.math.BigDecimal price;
}
