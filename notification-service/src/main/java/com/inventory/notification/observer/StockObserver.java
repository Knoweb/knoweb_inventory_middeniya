package com.inventory.notification.observer;

import com.inventory.notification.model.StockEvent;

/**
 * Observer Pattern Interface for Stock Events
 * Observers are notified when stock levels change
 */
public interface StockObserver {
    
    /**
     * Called when a stock event occurs
     * @param event Stock event details
     */
    void onStockChanged(StockEvent event);
    
    /**
     * Get observer type/name
     * @return Observer identifier
     */
    String getObserverType();
    
    /**
     * Check if observer is active
     * @return true if observer should receive notifications
     */
    boolean isActive();
}
