package com.inventory.notification.observer;

import com.inventory.notification.model.Notification;
import com.inventory.notification.model.StockEvent;
import com.inventory.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Observer that saves notifications to database
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseNotificationObserver implements StockObserver {
    
    private final NotificationRepository notificationRepository;
    private boolean active = true;
    
    @Override
    public void onStockChanged(StockEvent event) {
        log.info("DatabaseObserver received event: {} for product {}", 
            event.getEventType(), event.getProductId());
        
        Notification notification = new Notification();
        notification.setOrgId(event.getOrgId());
        notification.setType(event.getEventType().name());
        notification.setMessage(event.getMessage());
        notification.setReadStatus(false);
        
        notificationRepository.save(notification);
        
        log.info("Notification saved to database: {}", notification.getId());
    }
    
    @Override
    public String getObserverType() {
        return "DATABASE_NOTIFICATION";
    }
    
    @Override
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
}
