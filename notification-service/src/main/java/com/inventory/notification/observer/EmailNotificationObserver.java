package com.inventory.notification.observer;

import com.inventory.notification.model.StockEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Observer that sends email notifications
 * (Simulated - would integrate with email service in production)
 */
@Component
@Slf4j
public class EmailNotificationObserver implements StockObserver {
    
    private boolean active = true;
    
    @Override
    public void onStockChanged(StockEvent event) {
        // Only send emails for WARNING and CRITICAL events
        if ("INFO".equals(event.getSeverity())) {
            return;
        }
        
        log.info("EmailObserver sending email for event: {} - Severity: {}", 
            event.getEventType(), event.getSeverity());
        
        // Simulate email sending
        String emailSubject = getEmailSubject(event);
        String emailBody = getEmailBody(event);
        
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        log.info("EMAIL SENT - Subject: {} | Body: {}", emailSubject, emailBody);
    }
    
    private String getEmailSubject(StockEvent event) {
        return String.format("[%s] Stock Alert: %s", event.getSeverity(), event.getProductName());
    }
    
    private String getEmailBody(StockEvent event) {
        return String.format(
            "Stock Event Notification\n\n" +
            "Event Type: %s\n" +
            "Product: %s (ID: %d)\n" +
            "Warehouse: %s (ID: %d)\n" +
            "Current Quantity: %d\n" +
            "Message: %s\n" +
            "Timestamp: %s\n",
            event.getEventType(),
            event.getProductName(), event.getProductId(),
            event.getWarehouseName(), event.getWarehouseId(),
            event.getCurrentQuantity(),
            event.getMessage(),
            event.getTimestamp()
        );
    }
    
    @Override
    public String getObserverType() {
        return "EMAIL_NOTIFICATION";
    }
    
    @Override
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
}
