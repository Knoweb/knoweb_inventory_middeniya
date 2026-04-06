package com.inventory.inventoryservice.event;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StockEvent {
    private Long productId;
    private Long warehouseId;
    private EventType type;
    private String message;
    private LocalDateTime timestamp;
    private Integer remainingQuantity;
    private Integer thresholdLevel;
    private Long orgId;

    public enum EventType {
        LOW_STOCK
    }

    public static StockEvent createLowStockEvent(Long productId, Long warehouseId, int remainingQuantity,
            int thresholdLevel, Long orgId) {
        return StockEvent.builder()
                .productId(productId)
                .warehouseId(warehouseId)
                .orgId(orgId)
                .type(EventType.LOW_STOCK)
                .message(String.format(
                        "Low Stock Alert: Product %d at Warehouse %d has updated to %d (Reorder Level: %d)",
                        productId, warehouseId, remainingQuantity, thresholdLevel))
                .timestamp(LocalDateTime.now())
                .remainingQuantity(remainingQuantity)
                .thresholdLevel(thresholdLevel)
                .build();
    }
}
