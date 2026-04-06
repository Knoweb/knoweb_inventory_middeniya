package com.inventory.inventoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class COGSCalculationDTO {
    private Long productId;
    private Long warehouseId;
    private Integer quantitySold;
    private String strategy;
    private BigDecimal cogsAmount;
    private BigDecimal averageCostPerUnit;
    private String calculation;
}
