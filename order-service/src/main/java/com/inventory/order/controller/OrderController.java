package com.inventory.order.controller;

import com.inventory.order.dto.PurchaseOrderRequestDto;
import com.inventory.order.dto.PurchaseReturnRequestDto;
import com.inventory.order.model.PurchaseOrder;
import com.inventory.order.model.SalesOrder;
import com.inventory.order.repository.SalesOrderRepository;
import com.inventory.order.service.PurchaseOrderService;
import com.inventory.order.service.SalesOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final SalesOrderService salesOrderService;
    private final SalesOrderRepository salesOrderRepository;

    // ── Purchase Orders ───────────────────────────────────────────────────────

    /** GET /api/orders/purchase — list purchase orders for the caller's org */
    @GetMapping("/purchase")
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<PurchaseOrder> orders = (orgId != null)
                ? purchaseOrderService.getOrdersByOrg(orgId)
                : purchaseOrderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    /** GET /api/orders/purchase/{id} — get single order */
    @GetMapping("/purchase/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        return purchaseOrderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/orders/purchase — create a new purchase order.
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> createPurchaseOrder(@RequestBody PurchaseOrderRequestDto dto) {
        try {
            PurchaseOrder created = purchaseOrderService.createOrder(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/orders/purchase/{id}/approve — PENDING → APPROVED */
    @PatchMapping("/purchase/{id}/approve")
    public ResponseEntity<?> approvePurchaseOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseOrderService.approveOrder(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/orders/purchase/{id}/receive — APPROVED → RECEIVED */
    @PatchMapping("/purchase/{id}/receive")
    public ResponseEntity<?> receivePurchaseOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseOrderService.receiveOrder(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/orders/purchase/{id}/return — RECEIVED → RETURNED */
    @PatchMapping("/purchase/{id}/return")
    public ResponseEntity<?> returnPurchaseOrder(
            @PathVariable Long id,
            @RequestBody PurchaseReturnRequestDto request) {
        try {
            return ResponseEntity.ok(purchaseOrderService.returnOrder(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/orders/purchase/{id}/cancel — PENDING/APPROVED → CANCELLED */
    @PatchMapping("/purchase/{id}/cancel")
    public ResponseEntity<?> cancelPurchaseOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseOrderService.cancelOrder(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Sales Orders ──────────────────────────────────────────────────────────

    /** GET /api/orders/sales — list sales orders for the caller's org */
    @GetMapping("/sales")
    public ResponseEntity<List<SalesOrder>> getAllSalesOrders(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<SalesOrder> orders = (orgId != null)
                ? salesOrderRepository.findByOrgId(orgId)
                : salesOrderRepository.findAll();
        return ResponseEntity.ok(orders);
    }

    /** POST /api/orders/sales — create a new sales order */
    @PostMapping("/sales")
    public ResponseEntity<SalesOrder> createSalesOrder(@RequestBody SalesOrder order) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderRepository.save(order));
    }

    /**
     * PATCH /api/orders/sales/{id}/complete — PENDING → COMPLETED
     *
     * Fulfills the sales order:
     * 1. Marks status as COMPLETED.
     * 2. Calls inventory-service to deduct stock for each line item (OUT
     * transaction).
     * 3. Inserts inventory_transaction records for audit trail.
     */
    @PatchMapping("/sales/{id}/complete")
    public ResponseEntity<?> completeSalesOrder(@PathVariable Long id) {
        try {
            SalesOrder completed = salesOrderService.fulfillOrder(id);
            return ResponseEntity.ok(completed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sales/count")
    public ResponseEntity<Long> getSalesOrderCount(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        if (orgId == null)
            return ResponseEntity.ok(0L);
        return ResponseEntity.ok(salesOrderRepository.countByOrgId(orgId));
    }
}
