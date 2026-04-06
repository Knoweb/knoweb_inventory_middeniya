package com.inventory.inventoryservice.strategy;

import com.inventory.inventoryservice.model.InventoryTransaction;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * LIFO (Last-In-First-Out) Valuation Strategy
 * Assumes newest inventory is sold first
 */
@Component
public class LIFOValuationStrategy implements ValuationStrategy {

    @Override
    public BigDecimal calculateStockValue(List<InventoryTransaction> transactions, Integer currentQuantity) {
        if (currentQuantity == null || currentQuantity == 0 || transactions == null) {
            return BigDecimal.ZERO;
        }

        // Get only IN transactions, sorted by date descending (newest first)
        List<InventoryTransaction> inTransactions = transactions.stream()
                .filter(t -> InventoryTransaction.TransactionType.IN.equals(t.getType()))
                .sorted((t1, t2) -> t2.getTransactionDate().compareTo(t1.getTransactionDate()))
                .collect(Collectors.toList());

        BigDecimal totalValue = BigDecimal.ZERO;
        int remainingQuantity = currentQuantity;

        // Apply LIFO logic - take from newest batches first
        for (InventoryTransaction transaction : inTransactions) {
            if (remainingQuantity <= 0)
                break;

            int quantityInBatch = transaction.getQuantity() != null ? transaction.getQuantity() : 0;
            if (quantityInBatch <= 0)
                continue;

            int quantityFromBatch = Math.min(remainingQuantity, quantityInBatch);

            BigDecimal unitPrice = transaction.getUnitPrice() != null ? transaction.getUnitPrice() : BigDecimal.ZERO;

            BigDecimal batchValue = unitPrice.multiply(BigDecimal.valueOf(quantityFromBatch));

            totalValue = totalValue.add(batchValue);
            remainingQuantity -= quantityFromBatch;
        }

        return totalValue.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal calculateCOGS(List<InventoryTransaction> transactions, Integer quantitySold) {
        // COGS calculation is same as stock value for LIFO
        return calculateStockValue(transactions, quantitySold);
    }

    @Override
    public String getStrategyName() {
        return "LIFO";
    }
}
