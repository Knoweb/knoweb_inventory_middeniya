package com.inventory.reporting.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @GetMapping("/api/inventory/stocks/low-stock/count")
    Long getLowStockCount(@RequestHeader("X-Org-ID") Long orgId);

    @GetMapping("/api/inventory/stocks")
    java.util.List<Object> getStocks(@RequestHeader("X-Org-ID") Long orgId);
}
