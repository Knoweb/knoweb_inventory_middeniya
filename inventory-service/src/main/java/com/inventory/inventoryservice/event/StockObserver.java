package com.inventory.inventoryservice.event;

public interface StockObserver {
    void onStockEvent(StockEvent event);
}
