package com.inventory.inventoryservice.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockEventPublisher {

    private final List<StockObserver> observers;

    /**
     * Notify all registered observers about the stock event.
     * Logic: Triggers notifyObservers() in memory (as requested).
     *
     * @param event The event data
     */
    public void notifyObservers(StockEvent event) {
        log.info("StockEventPublisher: Notifying {} observers of event: {}", observers.size(), event);

        for (StockObserver observer : observers) {
            try {
                observer.onStockEvent(event);
            } catch (Exception e) {
                log.error("Error notifying observer: {}", observer.getClass().getName(), e);
            }
        }
    }
}
