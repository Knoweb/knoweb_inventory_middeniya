package com.inventory.inventoryservice.strategy;

import com.inventory.inventoryservice.model.InventoryTransaction;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Context class for Strategy Pattern
 * Allows switching between different valuation strategies at runtime
 */
@Service
public class ValuationContext {
    
    private final Map<String, ValuationStrategy> strategies = new HashMap<>();
    private ValuationStrategy currentStrategy;
    
    public ValuationContext(
        FIFOValuationStrategy fifoStrategy,
        LIFOValuationStrategy lifoStrategy,
        WeightedAverageValuationStrategy weightedAverageStrategy
    ) {
        strategies.put("FIFO", fifoStrategy);
        strategies.put("LIFO", lifoStrategy);
        strategies.put("WEIGHTED_AVERAGE", weightedAverageStrategy);
        
        // Default to FIFO
        this.currentStrategy = fifoStrategy;
    }
    
    /**
     * Set the valuation strategy
     * @param strategyName FIFO, LIFO, or WEIGHTED_AVERAGE
     */
    public void setStrategy(String strategyName) {
        ValuationStrategy strategy = strategies.get(strategyName);
        if (strategy != null) {
            this.currentStrategy = strategy;
        } else {
            throw new IllegalArgumentException("Unknown strategy: " + strategyName);
        }
    }
    
    /**
     * Calculate stock value using current strategy
     */
    public BigDecimal calculateStockValue(List<InventoryTransaction> transactions, Integer currentQuantity) {
        return currentStrategy.calculateStockValue(transactions, currentQuantity);
    }
    
    /**
     * Calculate stock value using specified strategy
     */
    public BigDecimal calculateStockValue(
        String strategyName, 
        List<InventoryTransaction> transactions, 
        Integer currentQuantity
    ) {
        ValuationStrategy strategy = strategies.get(strategyName);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown strategy: " + strategyName);
        }
        return strategy.calculateStockValue(transactions, currentQuantity);
    }
    
    /**
     * Calculate COGS using current strategy
     */
    public BigDecimal calculateCOGS(List<InventoryTransaction> transactions, Integer quantitySold) {
        return currentStrategy.calculateCOGS(transactions, quantitySold);
    }
    
    /**
     * Calculate COGS using specified strategy
     */
    public BigDecimal calculateCOGS(
        String strategyName,
        List<InventoryTransaction> transactions, 
        Integer quantitySold
    ) {
        ValuationStrategy strategy = strategies.get(strategyName);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown strategy: " + strategyName);
        }
        return strategy.calculateCOGS(transactions, quantitySold);
    }
    
    /**
     * Get current strategy name
     */
    public String getCurrentStrategyName() {
        return currentStrategy.getStrategyName();
    }
    
    /**
     * Get all available strategies
     */
    public List<String> getAvailableStrategies() {
        return List.copyOf(strategies.keySet());
    }
}
