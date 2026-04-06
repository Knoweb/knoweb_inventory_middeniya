package com.inventory.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Stock Event DTO for Observer Pattern
 * Contains details about stock level changes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockEvent {
    
    public enum EventType {
        LOW_STOCK, OUT_OF_STOCK, OVERSTOCKED, REORDER_POINT, STOCK_IN, STOCK_OUT
    }
    
    private Long productId;
    private String productName;
    private Long warehouseId;
    private String warehouseName;
    private Long orgId;
    private Long branchId;
    
    private Integer currentQuantity;
    private Integer previousQuantity;
    private Integer reorderLevel;
    private Integer maxStockLevel;
    
    private EventType eventType;
    private String message;
    private String severity; // INFO, WARNING, CRITICAL
    
    private LocalDateTime timestamp;
    
    public static StockEvent createLowStockEvent(
        Long productId, String productName, 
        Long warehouseId, String warehouseName,
        Integer currentQuantity, Integer reorderLevel,
        Long orgId
    ) {
        return StockEvent.builder()
            .productId(productId)
            .productName(productName)
            .warehouseId(warehouseId)
            .warehouseName(warehouseName)
            .currentQuantity(currentQuantity)
            .reorderLevel(reorderLevel)
            .orgId(orgId)
            .eventType(EventType.LOW_STOCK)
            .severity("WARNING")
            .message(String.format("Low stock alert: %s at %s. Current: %d, Reorder: %d", 
                productName, warehouseName, currentQuantity, reorderLevel))
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    public static StockEvent createOutOfStockEvent(
        Long productId, String productName,
        Long warehouseId, String warehouseName,
        Long orgId
    ) {
        return StockEvent.builder()
            .productId(productId)
            .productName(productName)
            .warehouseId(warehouseId)
            .warehouseName(warehouseName)
            .currentQuantity(0)
            .orgId(orgId)
            .eventType(EventType.OUT_OF_STOCK)
            .severity("CRITICAL")
            .message(String.format("OUT OF STOCK: %s at %s", productName, warehouseName))
            .timestamp(LocalDateTime.now())
            .build();
    }
}
