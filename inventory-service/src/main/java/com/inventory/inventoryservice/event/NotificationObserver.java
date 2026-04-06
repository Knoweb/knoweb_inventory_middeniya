package com.inventory.inventoryservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationObserver implements StockObserver {

    private final RestTemplate restTemplate;

    // Assuming Notification Service is registered in Eureka as
    // "NOTIFICATION-SERVICE" or similar
    private static final String NOTIFICATION_URL = "http://notification-service/api/notifications";

    @Override
    public void onStockEvent(StockEvent event) {
        if (event.getType() == StockEvent.EventType.LOW_STOCK) {
            log.info("Received LOW_STOCK event for Product {} at Warehouse {}. Sending notification...",
                    event.getProductId(), event.getWarehouseId());
            try {
                sendNotification(event);
            } catch (Exception e) {
                log.error("Failed to send notification for low stock event: {}", e.getMessage(), e);
            }
        }
    }

    private void sendNotification(StockEvent event) {
        NotificationRequest request = new NotificationRequest(
                event.getOrgId(),
                "WARNING", // Type
                event.getMessage(),
                event.getProductId() // Related entity ID
        );

        restTemplate.postForObject(NOTIFICATION_URL, request, Void.class);
        log.info("Notification sent successfully via {}", NOTIFICATION_URL);
    }

    @Data
    @AllArgsConstructor
    public static class NotificationRequest {
        private Long orgId;
        private String type;
        private String message; // Assuming backend expects 'message'
        private Long requestEntityId;
    }
}
