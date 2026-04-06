package com.inventory.inventoryservice.strategy;

import com.inventory.inventoryservice.model.InventoryTransaction;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Weighted Average Cost Valuation Strategy
 * Uses average cost of all inventory batches
 */
@Component
public class WeightedAverageValuationStrategy implements ValuationStrategy {

    @Override
    public BigDecimal calculateStockValue(List<InventoryTransaction> transactions, Integer currentQuantity) {
        if (currentQuantity == null || currentQuantity == 0 || transactions == null) {
            return BigDecimal.ZERO;
        }

        // Calculate weighted average cost
        BigDecimal totalCost = BigDecimal.ZERO;
        int totalInQuantity = 0;

        for (InventoryTransaction transaction : transactions) {
            if (InventoryTransaction.TransactionType.IN.equals(transaction.getType())) {
                BigDecimal unitPrice = transaction.getUnitPrice() != null ? transaction.getUnitPrice()
                        : BigDecimal.ZERO;
                int qty = transaction.getQuantity() != null ? transaction.getQuantity() : 0;

                BigDecimal transactionCost = unitPrice.multiply(BigDecimal.valueOf(qty));
                totalCost = totalCost.add(transactionCost);
                totalInQuantity += qty;
            }
        }

        if (totalInQuantity == 0) {
            return BigDecimal.ZERO;
        }

        // Average cost per unit
        BigDecimal averageCost = totalCost.divide(
                BigDecimal.valueOf(totalInQuantity),
                4,
                RoundingMode.HALF_UP);

        // Total value = average cost * current quantity
        return averageCost.multiply(BigDecimal.valueOf(currentQuantity))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal calculateCOGS(List<InventoryTransaction> transactions, Integer quantitySold) {
        if (quantitySold == null || quantitySold == 0) {
            return BigDecimal.ZERO;
        }

        // Calculate weighted average cost
        BigDecimal totalCost = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (InventoryTransaction transaction : transactions) {
            if ("IN".equals(transaction.getType())) {
                BigDecimal transactionCost = transaction.getUnitPrice()
                        .multiply(BigDecimal.valueOf(transaction.getQuantity()));
                totalCost = totalCost.add(transactionCost);
                totalQuantity += transaction.getQuantity();
            }
        }

        if (totalQuantity == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal averageCost = totalCost.divide(
                BigDecimal.valueOf(totalQuantity),
                4,
                RoundingMode.HALF_UP);

        return averageCost.multiply(BigDecimal.valueOf(quantitySold))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String getStrategyName() {
        return "WEIGHTED_AVERAGE";
    }
}
