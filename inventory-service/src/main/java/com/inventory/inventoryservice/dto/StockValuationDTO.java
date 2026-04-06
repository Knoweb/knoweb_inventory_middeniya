package com.inventory.inventoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockValuationDTO {
    private Long productId;
    private String productName;
    private String productSku;
    private Long warehouseId;
    private String warehouseName;
    private Long orgId;
    private Integer currentQuantity;
    private BigDecimal fifoValue;
    private BigDecimal lifoValue;
    private BigDecimal weightedAvgValue;
    private BigDecimal weightedAvgCost;
    private LocalDateTime lastTransactionDate;
    private BigDecimal valuationDifference; // FIFO - LIFO
}
