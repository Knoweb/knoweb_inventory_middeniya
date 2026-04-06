package com.inventory.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductRegistrationResponse {
    private Long productId;
    private String sku;
    private String name;
    private Long stockId;
    private String message;
}
