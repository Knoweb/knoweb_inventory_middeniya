package com.inventory.order.service;

import com.inventory.order.dto.PurchaseOrderRequestDto;
import com.inventory.order.dto.PurchaseReturnRequestDto;
import com.inventory.order.model.PurchaseOrder;
import com.inventory.order.model.PurchaseOrder.OrderStatus;
import com.inventory.order.model.PurchaseOrderItem;
import com.inventory.order.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PurchaseOrderService {

    /**
     * Single-owner system: all orders are automatically attributed to user ID 1.
     * Replace with a SecurityContext lookup when multi-user auth is added.
     */
    private static final Long OWNER_USER_ID = 1L;

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final RestTemplate restTemplate;

    @Value("${inventory.service.url:http://localhost:8082}")
    private String inventoryServiceUrl;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Create a new Purchase Order from the frontend DTO.
     *
     * Business rules applied here (NOT in the controller):
     * - status → always PENDING on creation
     * - createdBy → always OWNER_USER_ID (single-owner system)
     * - createdAt → set to now via @PrePersist on the entity
     * - totalAmount → computed from line items if not provided by the client
     */
    public PurchaseOrder createOrder(PurchaseOrderRequestDto dto) {
        log.info("Creating purchase order for supplierId={}, orgId={}", dto.getSupplierId(), dto.getOrgId());

        PurchaseOrder order = new PurchaseOrder();

        // ── Business-rule fields (never from the client) ──────────────────────
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedBy(OWNER_USER_ID);
        order.setCreatedAt(LocalDateTime.now());

        // ── Client-supplied fields ────────────────────────────────────────────
        order.setSupplierId(dto.getSupplierId());
        order.setWarehouseId(dto.getWarehouseId());
        order.setOrgId(dto.getOrgId());

        // ── Build line items ──────────────────────────────────────────────────
        List<PurchaseOrderItem> items = new ArrayList<>();
        BigDecimal computedTotal = BigDecimal.ZERO;

        if (dto.getItems() != null) {
            for (PurchaseOrderRequestDto.OrderItemDto itemDto : dto.getItems()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setProductId(itemDto.getProductId());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitPrice(itemDto.getUnitPrice());
                item.setPurchaseOrder(order); // set back-reference for FK
                items.add(item);

                // Accumulate total: qty × unitPrice
                if (itemDto.getUnitPrice() != null && itemDto.getQuantity() != null) {
                    computedTotal = computedTotal.add(
                            itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
                }
            }
        }

        order.setItems(items);

        // Use client-provided total if given, otherwise use the computed value
        order.setTotalAmount(
                dto.getTotalAmount() != null ? dto.getTotalAmount() : computedTotal);

        PurchaseOrder saved = purchaseOrderRepository.save(order);
        log.info("Purchase order created successfully: id={}, total={}", saved.getId(), saved.getTotalAmount());
        return saved;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }

    public List<PurchaseOrder> getOrdersByOrg(Long orgId) {
        return purchaseOrderRepository.findByOrgId(orgId);
    }

    public List<PurchaseOrder> getOrdersBySupplier(Long supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }

    public Optional<PurchaseOrder> getOrderById(Long id) {
        return purchaseOrderRepository.findById(id);
    }

    // ── Status transitions ────────────────────────────────────────────────────

    /**
     * Approve a PENDING order → APPROVED.
     * Throws if the order is not in PENDING state.
     */
    public PurchaseOrder approveOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Only PENDING orders can be approved. Current status: " + order.getStatus());
        }
        order.setStatus(OrderStatus.APPROVED);
        log.info("Purchase order {} approved", id);
        return purchaseOrderRepository.save(order);
    }

    /**
     * Mark an APPROVED order as RECEIVED (goods delivered).
     * Automatically increases stock in inventory-service (IN transaction).
     */
    public PurchaseOrder receiveOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException(
                    "Only APPROVED orders can be received. Current status: " + order.getStatus());
        }

        // ── SYNC: Increase stock in inventory-service for each item ───────────
        for (PurchaseOrderItem item : order.getItems()) {
            syncWithInventory(item, order, "IN", "Purchase order received — order #PO-" + String.format("%03d", id));
        }

        order.setStatus(OrderStatus.RECEIVED);
        log.info("Purchase order {} marked as RECEIVED and stock increased", id);
        return purchaseOrderRepository.save(order);
    }

    /**
     * Return a RECEIVED order back to the supplier (goods damaged/incorrect).
     * Supports partial returns for specific line items.
     * Automatically decreases stock in inventory-service (OUT transaction) with a reason.
     */
    public PurchaseOrder returnOrder(Long id, PurchaseReturnRequestDto request) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() != OrderStatus.RECEIVED) {
            throw new IllegalStateException("Only RECEIVED orders can be returned. Current status: " + order.getStatus());
        }

        String reason = request.getReason();
        if (reason == null || reason.trim().isEmpty()) {
            reason = "No reason provided";
        }

        // ── SYNC: Decrease stock for each item specified in the return request ─
        if (request.getItems() != null) {
            for (PurchaseReturnRequestDto.ReturnItem returnItem : request.getItems()) {
                if (returnItem.getQuantity() != null && returnItem.getQuantity() > 0) {
                    // Find the original item to get the productId and price
                    PurchaseOrderItem originalItem = order.getItems().stream()
                            .filter(it -> it.getId().equals(returnItem.getItemId()))
                            .findFirst()
                            .orElse(null);
                    
                    if (originalItem != null) {
                        // Subtract price and quantity
                        BigDecimal returnPrice = originalItem.getUnitPrice().multiply(new BigDecimal(returnItem.getQuantity()));
                        order.setTotalAmount(order.getTotalAmount().subtract(returnPrice));
                        originalItem.setQuantity(originalItem.getQuantity() - returnItem.getQuantity());

                        // Create a temporary item for sync purposes with the return quantity
                        PurchaseOrderItem syncItem = new PurchaseOrderItem();
                        syncItem.setProductId(originalItem.getProductId());
                        syncItem.setQuantity(returnItem.getQuantity());
                        syncItem.setUnitPrice(originalItem.getUnitPrice());
                        
                        syncWithInventory(syncItem, order, "OUT", "Purchase return — Reason: " + reason);
                    }
                }
            }
        }

        order.setStatus(OrderStatus.RETURNED);
        order.setReturnReason(reason);
        order.setReturnedAt(LocalDateTime.now());
        
        log.info("Purchase order {} partially/fully returned. Reason: {}", id, reason);
        return purchaseOrderRepository.save(order);
    }

    /**
     * Private helper to call inventory-service REST API.
     */
    private void syncWithInventory(PurchaseOrderItem item, PurchaseOrder order, String type, String notes) {
        Long productId = item.getProductId();
        Long warehouseId = order.getWarehouseId();
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;

        if (qty <= 0 || warehouseId == null) {
            log.warn("Skipping inventory sync for PO item (productId={}, warehouseId={}, qty={})", 
                    productId, warehouseId, qty);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("productId", productId);
        payload.put("warehouseId", warehouseId);
        payload.put("type", type);
        payload.put("quantity", qty);
        payload.put("referenceId", "PO-" + String.format("%03d", order.getId()));
        payload.put("notes", notes);
        payload.put("transactionDate", LocalDateTime.now().withNano(0).toString());
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
                throw new RuntimeException("Inventory-service returned " + response.getStatusCode() + " for productId=" + productId);
            }
            log.info("Inventory sync success: PO-id={}, type={}, productId={}, qty={}", order.getId(), type, productId, qty);
        } catch (Exception e) {
            log.error("Failed to sync inventory for PO product #{}: {}", productId, e.getMessage());
            throw new RuntimeException("Inventory sync failed: " + e.getMessage(), e);
        }
    }

    /**
     * Cancel a PENDING or APPROVED order.
     */
    public PurchaseOrder cancelOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        if (order.getStatus() == OrderStatus.RECEIVED || order.getStatus() == OrderStatus.RETURNED) {
            throw new IllegalStateException("Cannot cancel an order that has already been RECEIVED or RETURNED.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        log.info("Purchase order {} cancelled", id);
        return purchaseOrderRepository.save(order);
    }
}
