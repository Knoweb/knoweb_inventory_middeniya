package com.inventory.notification.observer;

import com.inventory.notification.model.StockEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

/**
 * Subject/Publisher in Observer Pattern
 * Manages observers and notifies them of stock events
 */
@Service
@Slf4j
public class StockEventPublisher {
    
    private final List<StockObserver> observers = new ArrayList<>();
    
    public StockEventPublisher(
        DatabaseNotificationObserver databaseObserver,
        EmailNotificationObserver emailObserver,
        SMSNotificationObserver smsObserver
    ) {
        // Register all observers
        registerObserver(databaseObserver);
        registerObserver(emailObserver);
        registerObserver(smsObserver);
    }
    
    /**
     * Register a new observer
     * @param observer Observer to register
     */
    public void registerObserver(StockObserver observer) {
        if (!observers.contains(observer)) {
            observers.add(observer);
            log.info("Observer registered: {}", observer.getObserverType());
        }
    }
    
    /**
     * Unregister an observer
     * @param observer Observer to unregister
     */
    public void unregisterObserver(StockObserver observer) {
        observers.remove(observer);
        log.info("Observer unregistered: {}", observer.getObserverType());
    }
    
    /**
     * Notify all active observers of a stock event
     * @param event Stock event to publish
     */
    public void notifyObservers(StockEvent event) {
        log.info("Publishing stock event: {} for product {}", 
            event.getEventType(), event.getProductId());
        
        int notifiedCount = 0;
        for (StockObserver observer : observers) {
            if (observer.isActive()) {
                try {
                    observer.onStockChanged(event);
                    notifiedCount++;
                } catch (Exception e) {
                    log.error("Error notifying observer {}: {}", 
                        observer.getObserverType(), e.getMessage());
                }
            }
        }
        
        log.info("Notified {} observers for event {}", notifiedCount, event.getEventType());
    }
    
    /**
     * Get all registered observers
     * @return List of observers
     */
    public List<StockObserver> getObservers() {
        return new ArrayList<>(observers);
    }
    
    /**
     * Get count of active observers
     * @return Number of active observers
     */
    public long getActiveObserverCount() {
        return observers.stream().filter(StockObserver::isActive).count();
    }
}
