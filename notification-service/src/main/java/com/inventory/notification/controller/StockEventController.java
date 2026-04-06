package com.inventory.notification.controller;

import com.inventory.notification.model.StockEvent;
import com.inventory.notification.observer.StockEventPublisher;
import com.inventory.notification.observer.StockObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST Controller for Stock Event Observer Pattern
 * Allows triggering and managing stock event notifications
 */
@RestController
@RequestMapping("/api/notifications/events")
@RequiredArgsConstructor
public class StockEventController {
    
    private final StockEventPublisher eventPublisher;
    
    /**
     * Publish a stock event (triggers all observers)
     */
    @PostMapping("/publish")
    public ResponseEntity<Map<String, Object>> publishEvent(@RequestBody StockEvent event) {
        eventPublisher.notifyObservers(event);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("eventType", event.getEventType());
        result.put("notifiedObservers", eventPublisher.getActiveObserverCount());
        result.put("timestamp", event.getTimestamp());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get all registered observers and their status
     */
    @GetMapping("/observers")
    public ResponseEntity<Map<String, Object>> getObservers() {
        List<Map<String, Object>> observerInfo = eventPublisher.getObservers().stream()
            .map(observer -> {
                Map<String, Object> info = new HashMap<>();
                info.put("type", observer.getObserverType());
                info.put("active", observer.isActive());
                return info;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("observers", observerInfo);
        result.put("totalCount", observerInfo.size());
        result.put("activeCount", eventPublisher.getActiveObserverCount());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Simulate stock events for testing
     */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateEvents(
        @RequestParam(defaultValue = "LOW_STOCK") String eventType,
        @RequestParam Long productId,
        @RequestParam(defaultValue = "Test Product") String productName,
        @RequestParam Long warehouseId,
        @RequestParam(defaultValue = "Main Warehouse") String warehouseName,
        @RequestParam Long orgId
    ) {
        StockEvent event;
        
        switch (eventType.toUpperCase()) {
            case "OUT_OF_STOCK":
                event = StockEvent.createOutOfStockEvent(
                    productId, productName, warehouseId, warehouseName, orgId
                );
                break;
            case "LOW_STOCK":
            default:
                event = StockEvent.createLowStockEvent(
                    productId, productName, warehouseId, warehouseName, 5, 20, orgId
                );
                break;
        }
        
        eventPublisher.notifyObservers(event);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("simulatedEvent", event);
        result.put("notifiedObservers", eventPublisher.getActiveObserverCount());
        
        return ResponseEntity.ok(result);
    }
}
