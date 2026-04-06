package com.inventory.inventoryservice.service;

import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.model.StockLedger;
import com.inventory.inventoryservice.repository.StockLedgerRepository;
import com.inventory.inventoryservice.repository.InventoryTransactionRepository;
import com.inventory.inventoryservice.strategy.ValuationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Stock Ledger Service - Manages cost layers and inventory valuation
 * Maintains running balance and calculates values using different strategies
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockLedgerService {

    private final StockLedgerRepository ledgerRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ValuationContext valuationContext;

    /**
     * Record a transaction in the stock ledger
     * ✅ CRITICAL FIX: Uses REQUIRES_NEW propagation so errors here don't rollback the main transaction
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StockLedger recordTransaction(InventoryTransaction transaction) {
        log.info("Recording transaction {} in stock ledger", transaction.getId());

        // Get latest ledger entry for this product-warehouse combination
        StockLedger previousEntry = ledgerRepository
                .findTopByProductIdAndWarehouseIdOrderByTransactionDateDesc(transaction.getProductId(),
                        transaction.getWarehouseId())
                .orElse(null);

        Integer previousBalance = previousEntry != null ? previousEntry.getQuantityBalance() : 0;
        BigDecimal previousRunningBalance = previousEntry != null ? previousEntry.getRunningBalance() : BigDecimal.ZERO;

        // Create new ledger entry
        StockLedger ledgerEntry = new StockLedger();
        ledgerEntry.setProductId(transaction.getProductId());
        ledgerEntry.setWarehouseId(transaction.getWarehouseId());
        ledgerEntry.setOrgId(transaction.getOrgId());
        ledgerEntry.setTransactionId(transaction.getId());
        ledgerEntry.setTransactionType(transaction.getType().name());
        ledgerEntry.setTransactionDate(transaction.getTransactionDate());
        ledgerEntry.setReferenceId(transaction.getReferenceId());
        ledgerEntry.setNotes(transaction.getNotes());
        ledgerEntry.setCreatedBy(transaction.getCreatedBy());

        // Calculate quantities based on transaction type
        switch (transaction.getType()) {
            case IN:
            case RETURN:
                ledgerEntry.setQuantityIn(transaction.getQuantity());
                ledgerEntry.setQuantityOut(0);
                ledgerEntry.setQuantityBalance(previousBalance + transaction.getQuantity());
                break;
            case OUT:
            case TRANSFER:
                ledgerEntry.setQuantityIn(0);
                ledgerEntry.setQuantityOut(transaction.getQuantity());
                ledgerEntry.setQuantityBalance(previousBalance - transaction.getQuantity());
                break;
            case ADJUSTMENT:
                if (transaction.getQuantity() >= 0) {
                    ledgerEntry.setQuantityIn(Math.abs(transaction.getQuantity()));
                    ledgerEntry.setQuantityOut(0);
                } else {
                    ledgerEntry.setQuantityIn(0);
                    ledgerEntry.setQuantityOut(Math.abs(transaction.getQuantity()));
                }
                ledgerEntry.setQuantityBalance(previousBalance + transaction.getQuantity());
                break;
        }

        BigDecimal unitCost = transaction.getUnitPrice() != null ? transaction.getUnitPrice() : BigDecimal.ZERO;
        ledgerEntry.setUnitCost(unitCost);

        int qty = transaction.getQuantity() != null ? transaction.getQuantity() : 0;
        BigDecimal transactionCost = unitCost.multiply(
                BigDecimal.valueOf(Math.abs(qty))).setScale(2, RoundingMode.HALF_UP);
        ledgerEntry.setTotalCost(transactionCost);

        // Update running balance
        if (ledgerEntry.getQuantityIn() > 0) {
            ledgerEntry.setRunningBalance(previousRunningBalance.add(transactionCost));
        } else {
            ledgerEntry.setRunningBalance(previousRunningBalance.subtract(transactionCost));
        }

        // Calculate weighted average cost
        BigDecimal weightedAvgCost = calculateWeightedAverageCost(
                transaction.getProductId(),
                transaction.getWarehouseId());
        ledgerEntry.setWeightedAvgCost(weightedAvgCost);

        // Calculate FIFO and LIFO values
        List<InventoryTransaction> allTransactions = transactionRepository
                .findByProductIdAndWarehouseIdOrderByTransactionDateAsc(
                        transaction.getProductId(),
                        transaction.getWarehouseId());

        if (ledgerEntry.getQuantityBalance() > 0) {
            BigDecimal fifoValue = valuationContext.calculateStockValue(
                    "FIFO", allTransactions, ledgerEntry.getQuantityBalance());
            ledgerEntry.setFifoValue(fifoValue);

            BigDecimal lifoValue = valuationContext.calculateStockValue(
                    "LIFO", allTransactions, ledgerEntry.getQuantityBalance());
            ledgerEntry.setLifoValue(lifoValue);
        } else {
            ledgerEntry.setFifoValue(BigDecimal.ZERO);
            ledgerEntry.setLifoValue(BigDecimal.ZERO);
        }

        return ledgerRepository.save(ledgerEntry);
    }

    /**
     * Calculate weighted average cost for a product-warehouse
     */
    public BigDecimal calculateWeightedAverageCost(Long productId, Long warehouseId) {
        List<InventoryTransaction> transactions = transactionRepository
                .findByProductIdAndWarehouseIdOrderByTransactionDateAsc(productId, warehouseId);

        BigDecimal currentTotalValue = BigDecimal.ZERO;
        int currentQuantity = 0;

        for (InventoryTransaction txn : transactions) {
            int qty = txn.getQuantity();
            BigDecimal unitPrice = txn.getUnitPrice() != null ? txn.getUnitPrice() : BigDecimal.ZERO;

            switch (txn.getType()) {
                case IN:
                case RETURN:
                    // Add new cost layer to existing pool
                    currentTotalValue = currentTotalValue.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
                    currentQuantity += qty;
                    break;
                case OUT:
                case TRANSFER:
                    // When moving out, the value decreases proportionally to current average
                    if (currentQuantity > 0) {
                        BigDecimal avgAtMoment = currentTotalValue.divide(BigDecimal.valueOf(currentQuantity), 4, RoundingMode.HALF_UP);
                        currentTotalValue = currentTotalValue.subtract(avgAtMoment.multiply(BigDecimal.valueOf(qty)));
                        currentQuantity -= qty;
                    }
                    break;
                case ADJUSTMENT:
                    if (qty >= 0) {
                        currentTotalValue = currentTotalValue.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
                    } else {
                        if (currentQuantity > 0) {
                            BigDecimal avgAtMoment = currentTotalValue.divide(BigDecimal.valueOf(currentQuantity), 4, RoundingMode.HALF_UP);
                            currentTotalValue = currentTotalValue.subtract(avgAtMoment.multiply(BigDecimal.valueOf(Math.abs(qty))));
                        }
                    }
                    currentQuantity += qty;
                    break;
            }
            
            // Safety: Floor values at zero
            if (currentQuantity < 0) currentQuantity = 0;
            if (currentTotalValue.compareTo(BigDecimal.ZERO) < 0) currentTotalValue = BigDecimal.ZERO;
        }

        if (currentQuantity <= 0) {
            return BigDecimal.ZERO;
        }

        return currentTotalValue.divide(
                BigDecimal.valueOf(currentQuantity),
                4,
                RoundingMode.HALF_UP);
    }

    /**
     * Get stock ledger for a product-warehouse
     */
    public List<StockLedger> getLedger(Long productId, Long warehouseId) {
        return ledgerRepository.findByProductIdAndWarehouseIdOrderByTransactionDateAsc(
                productId, warehouseId);
    }

    /**
     * Get latest ledger entry
     */
    public StockLedger getLatestEntry(Long productId, Long warehouseId) {
        return ledgerRepository.findTopByProductIdAndWarehouseIdOrderByTransactionDateDesc(productId, warehouseId)
                .orElse(null);
    }

    /**
     * Get ledger entries for a date range
     */
    public List<StockLedger> getLedgerByDateRange(
            Long productId,
            Long warehouseId,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        return ledgerRepository.findByProductWarehouseAndDateRange(
                productId, warehouseId, startDate, endDate);
    }

    /**
     * Get organization ledger
     */
    public List<StockLedger> getOrganizationLedger(Long orgId) {
        return ledgerRepository.findByOrgIdOrderByTransactionDateDesc(orgId);
    }

    /**
     * Rebuild stock ledger from transactions
     * Use this to recalculate ledger if corrections are needed
     */
    @Transactional
    public void rebuildLedger(Long productId, Long warehouseId) {
        log.info("Rebuilding stock ledger for product {} in warehouse {}", productId, warehouseId);

        // Delete existing ledger entries
        List<StockLedger> existingEntries = ledgerRepository
                .findByProductIdAndWarehouseIdOrderByTransactionDateAsc(productId, warehouseId);
        ledgerRepository.deleteAll(existingEntries);

        // Get all transactions
        List<InventoryTransaction> transactions = transactionRepository
                .findByProductIdAndWarehouseIdOrderByTransactionDateAsc(productId, warehouseId);

        // Rebuild ledger entry by entry
        for (InventoryTransaction transaction : transactions) {
            recordTransaction(transaction);
        }

        log.info("Stock ledger rebuilt successfully");
    }

    /**
     * Get current stock value using different strategies
     */
    public StockValuationSummary getCurrentStockValuation(Long productId, Long warehouseId) {
        StockLedger latestEntry = getLatestEntry(productId, warehouseId);

        if (latestEntry == null || latestEntry.getQuantityBalance() == 0) {
            return new StockValuationSummary(
                    productId, warehouseId, 0,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        return new StockValuationSummary(
                productId,
                warehouseId,
                latestEntry.getQuantityBalance(),
                latestEntry.getFifoValue(),
                latestEntry.getLifoValue(),
                latestEntry.getWeightedAvgCost().multiply(
                        BigDecimal.valueOf(latestEntry.getQuantityBalance())).setScale(2, RoundingMode.HALF_UP),
                latestEntry.getWeightedAvgCost());
    }

    /**
     * DTO for stock valuation summary
     */
    public static class StockValuationSummary {
        public Long productId;
        public Long warehouseId;
        public Integer currentQuantity;
        public BigDecimal fifoValue;
        public BigDecimal lifoValue;
        public BigDecimal weightedAvgValue;
        public BigDecimal weightedAvgCost;

        public StockValuationSummary(Long productId, Long warehouseId, Integer currentQuantity,
                BigDecimal fifoValue, BigDecimal lifoValue,
                BigDecimal weightedAvgValue, BigDecimal weightedAvgCost) {
            this.productId = productId;
            this.warehouseId = warehouseId;
            this.currentQuantity = currentQuantity;
            this.fifoValue = fifoValue;
            this.lifoValue = lifoValue;
            this.weightedAvgValue = weightedAvgValue;
            this.weightedAvgCost = weightedAvgCost;
        }
    }
}
