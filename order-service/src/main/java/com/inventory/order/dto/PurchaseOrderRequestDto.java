package com.inventory.order.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO received from the frontend when creating a Purchase Order.
 * Note: createdBy and status are NOT accepted from the client —
 * they are set automatically in the service layer.
 */
@Data
public class PurchaseOrderRequestDto {

    /** The supplier this order is placed with. */
    private Long supplierId;

    /** The warehouse this order is destined for. */
    private Long warehouseId;

    /** Organisation ID (read from JWT/header in production; optional here). */
    private Long orgId;

    /** Optional: pre-calculated total. If null, service computes from items. */
    private BigDecimal totalAmount;

    /** Line items for this order. */
    private List<OrderItemDto> items;

    /** Optional notes / reference number. */
    private String notes;

    // ── Nested line-item DTO ──────────────────────────────────────────────────

    @Data
    public static class OrderItemDto {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
