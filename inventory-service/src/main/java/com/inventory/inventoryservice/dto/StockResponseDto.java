package com.inventory.inventoryservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockResponseDto {
    private Long id;
    private Long productId;
    private Long warehouseId;
    private Long branchId;
    private Integer quantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Long orgId;
    private Integer reorderLevel;
    private String productName;
    private String productSku;
    private String category;
    private java.math.BigDecimal unitPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
