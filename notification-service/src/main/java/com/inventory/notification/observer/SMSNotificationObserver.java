package com.inventory.notification.observer;

import com.inventory.notification.model.StockEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Observer that sends SMS notifications
 * (Simulated - would integrate with SMS service in production)
 */
@Component
@Slf4j
public class SMSNotificationObserver implements StockObserver {
    
    private boolean active = true;
    
    @Override
    public void onStockChanged(StockEvent event) {
        // Only send SMS for CRITICAL events
        if (!"CRITICAL".equals(event.getSeverity())) {
            return;
        }
        
        log.info("SMSObserver sending SMS for CRITICAL event: {}", event.getEventType());
        
        String smsMessage = getSMSMessage(event);
        
        // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
        log.info("SMS SENT - Message: {}", smsMessage);
    }
    
    private String getSMSMessage(StockEvent event) {
        return String.format(
            "CRITICAL ALERT: %s at %s. Current: %d. Immediate action required!",
            event.getProductName(),
            event.getWarehouseName(),
            event.getCurrentQuantity()
        );
    }
    
    @Override
    public String getObserverType() {
        return "SMS_NOTIFICATION";
    }
    
    @Override
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
}
