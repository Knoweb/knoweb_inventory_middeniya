package com.inventory.inventoryservice.strategy;

import com.inventory.inventoryservice.model.InventoryTransaction;
import java.math.BigDecimal;
import java.util.List;

/**
 * Strategy Pattern Interface for Stock Valuation
 * Supports different inventory valuation methods (FIFO, LIFO, Weighted Average)
 */
public interface ValuationStrategy {
    
    /**
     * Calculate the value of current stock based on transactions
     * @param transactions List of inventory transactions
     * @param currentQuantity Current stock quantity
     * @return Total value of current stock
     */
    BigDecimal calculateStockValue(List<InventoryTransaction> transactions, Integer currentQuantity);
    
    /**
     * Calculate the cost of goods sold for a transaction
     * @param transactions Historical transactions
     * @param quantitySold Quantity being sold
     * @return Cost of goods sold
     */
    BigDecimal calculateCOGS(List<InventoryTransaction> transactions, Integer quantitySold);
    
    /**
     * Get the strategy name
     * @return Strategy identifier (FIFO, LIFO, WEIGHTED_AVERAGE)
     */
    String getStrategyName();
}
