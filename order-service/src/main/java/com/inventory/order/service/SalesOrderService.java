package com.inventory.order.service;

import com.inventory.order.model.SalesOrder;
import com.inventory.order.model.SalesOrder.OrderStatus;
import com.inventory.order.model.SalesOrderItem;
import com.inventory.order.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for Sales Order business logic.
 *
 * fulfillOrder() transitions a PENDING sales order to COMPLETED and:
 * 1. Decreases stock quantity for each line item in the inventory-service.
 * 2. Records an inventory_transaction (type=OUT) for each item.
 *
 * The inventory-service is called via REST (HTTP) because it lives in a
 * separate microservice with its own database (inventory_db).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final RestTemplate restTemplate;

    /**
     * Base URL of the inventory-service — configurable via application.properties
     */
    @Value("${inventory.service.url:http://localhost:8082}")
    private String inventoryServiceUrl;

    // ── Fulfill ───────────────────────────────────────────────────────────────

    /**
     * Fulfill a PENDING sales order:
     * - Marks the order as COMPLETED.
     * - For each line item, calls inventory-service to deduct stock (OUT
     * transaction).
     */
    public SalesOrder fulfillOrder(Long orderId) {
        log.info("Fulfilling sales order id={}", orderId);

        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Sales order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING orders can be fulfilled. Current status: " + order.getStatus());
        }

        // ── Deduct stock for each line item via inventory-service ─────────────
        for (SalesOrderItem item : order.getItems()) {
            deductStock(item, order);
        }

        // ── Mark order as COMPLETED ───────────────────────────────────────────
        order.setStatus(OrderStatus.COMPLETED);
        SalesOrder saved = salesOrderRepository.save(order);
        log.info("Sales order {} marked as COMPLETED", orderId);
        return saved;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Calls the inventory-service REST API to record a stock OUT movement.
     *
     * Steps:
     * 1. GET /api/inventory/stocks/product/{productId} to find the warehouse
     * that holds this product (we use the first matching stock record).
     * 2. POST /api/inventory/transactions with type=OUT + warehouseId so the
     * inventory-service can update the correct stock row.
     *
     * The warehouseId is REQUIRED by the inventory-service — without it the
     * stock lookup fails and it tries to create a new Stock with null warehouseId
     * which violates the NOT NULL DB constraint.
     */
    @SuppressWarnings("unchecked")
    private void deductStock(SalesOrderItem item, SalesOrder order) {
        Long productId = item.getProductId();
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;

        if (qty <= 0) {
            log.warn("Skipping stock deduction for productId={} — quantity is {}", productId, qty);
            return;
        }

        // ── Step 1: resolve warehouseId ───────────────────────────────────────
        // Primary source: the warehouseId saved on the sales order itself.
        // Fallback: look up the first stock record for this product.
        Long warehouseId = order.getWarehouseId();

        if (warehouseId == null) {
            log.info("Order has no warehouseId — querying inventory-service for productId={}", productId);
            String stocksUrl = inventoryServiceUrl + "/api/inventory/stocks/product/" + productId;
            try {
                ResponseEntity<List> stocksResponse = restTemplate.getForEntity(stocksUrl, List.class);
                if (stocksResponse.getStatusCode().is2xxSuccessful()
                        && stocksResponse.getBody() != null
                        && !stocksResponse.getBody().isEmpty()) {
                    Object first = stocksResponse.getBody().get(0);
                    if (first instanceof Map) {
                        Object wid = ((Map<?, ?>) first).get("warehouseId");
                        if (wid instanceof Number) {
                            warehouseId = ((Number) wid).longValue();
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch stock for productId={}: {}", productId, e.getMessage());
            }
        }

        if (warehouseId == null) {
            log.error("Cannot deduct stock for productId={} — no warehouseId available on order or in inventory",
                    productId);
            throw new RuntimeException(
                    "Stock deduction failed for product #" + productId +
                            ": no warehouse found. Please ensure the sales order has a warehouse selected.");
        }

        // ── Step 2: POST the OUT transaction ──────────────────────────────────
        // Use a clean ISO-8601 format (no nanoseconds) so Jackson on the
        // inventory-service side can deserialize transactionDate reliably.
        String transactionDate = LocalDateTime.now()
                .withNano(0)
                .toString(); // e.g. "2026-02-18T21:29:57"

        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", productId);
        payload.put("warehouseId", warehouseId);
        payload.put("type", "OUT");
        payload.put("quantity", qty);
        payload.put("referenceId", "SO-" + String.format("%03d", order.getId()));
        payload.put("notes", "Sales order fulfillment — order #SO-" + String.format("%03d", order.getId()));
        payload.put("transactionDate", transactionDate);
        payload.put("orgId", order.getOrgId());
        payload.put("movementStatus", "COMPLETED");

        if (item.getUnitPrice() != null) {
            payload.put("unitPrice", item.getUnitPrice());
            payload.put("totalValue", item.getUnitPrice().multiply(BigDecimal.valueOf(qty)));
        }

        String txUrl = inventoryServiceUrl + "/api/inventory/transactions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(txUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException(
                        "Inventory-service returned " + response.getStatusCode() +
                                " for productId=" + productId);
            }
            log.info("Stock deducted: productId={}, warehouseId={}, qty={}, orderId={}",
                    productId, warehouseId, qty, order.getId());
        } catch (Exception e) {
            log.error("Failed to deduct stock for productId={}: {}", productId, e.getMessage());
            throw new RuntimeException(
                    "Stock deduction failed for product #" + productId + ": " + e.getMessage(), e);
        }
    }
}
