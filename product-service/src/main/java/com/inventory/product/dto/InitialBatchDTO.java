package com.inventory.product.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InitialBatchDTO {
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private Long warehouseId;
}
