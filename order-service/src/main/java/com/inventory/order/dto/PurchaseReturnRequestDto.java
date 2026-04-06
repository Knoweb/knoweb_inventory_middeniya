package com.inventory.order.dto;

import lombok.Data;
import java.util.List;

@Data
public class PurchaseReturnRequestDto {
    private String reason;
    private List<ReturnItem> items;

    @Data
    public static class ReturnItem {
        private Long itemId;
        private Integer quantity;
    }
}
