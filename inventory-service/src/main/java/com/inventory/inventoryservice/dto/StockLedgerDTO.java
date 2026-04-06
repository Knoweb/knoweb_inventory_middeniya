package com.inventory.inventoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockLedgerDTO {
    private Long id;
    private Long productId;
    private Long warehouseId;
    private String transactionType;
    private LocalDateTime transactionDate;
    private Integer quantityIn;
    private Integer quantityOut;
    private Integer quantityBalance;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private BigDecimal runningBalance;
    private BigDecimal weightedAvgCost;
    private String referenceId;
    private String notes;
}
