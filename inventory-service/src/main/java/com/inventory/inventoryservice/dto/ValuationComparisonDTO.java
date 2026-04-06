package com.inventory.inventoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValuationComparisonDTO {
    private Long productId;
    private Long warehouseId;
    private Integer currentQuantity;
    private BigDecimal fifoValue;
    private BigDecimal lifoValue;
    private BigDecimal weightedAvgValue;
    private BigDecimal maxDifference;
    private String recommendedMethod;
    private String reasoning;
    private List<ValuationMethodDetail> methodDetails;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValuationMethodDetail {
        private String method;
        private BigDecimal value;
        private BigDecimal unitCost;
        private String description;
    }
}
