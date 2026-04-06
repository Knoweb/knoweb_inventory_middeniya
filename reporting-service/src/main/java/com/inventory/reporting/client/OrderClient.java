package com.inventory.reporting.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "order-service")
public interface OrderClient {

    @GetMapping("/api/orders/sales/count")
    Long getSalesOrderCount(@RequestHeader("X-Org-ID") Long orgId);

    @GetMapping("/api/orders/sales")
    java.util.List<Object> getSalesOrders(@RequestHeader("X-Org-ID") Long orgId);
}
