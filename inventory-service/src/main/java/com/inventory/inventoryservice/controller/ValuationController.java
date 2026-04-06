package com.inventory.inventoryservice.controller;

import com.inventory.inventoryservice.dto.COGSCalculationDTO;
import com.inventory.inventoryservice.dto.ValuationComparisonDTO;
import com.inventory.inventoryservice.dto.StockValuationDTO;
import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.repository.InventoryTransactionRepository;
import com.inventory.inventoryservice.repository.StockRepository;
import com.inventory.inventoryservice.service.StockLedgerService;
import com.inventory.inventoryservice.strategy.ValuationContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for stock valuation using Strategy Pattern
 */
@RestController
@RequestMapping("/api/inventory/valuation")
@RequiredArgsConstructor
public class ValuationController {

    private final ValuationContext valuationContext;
    private final InventoryTransactionRepository transactionRepository;
    private final StockRepository stockRepository;
    private final StockLedgerService stockLedgerService;

    /**
     * Get stock value using different valuation methods
     */
    @GetMapping("/stock/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<StockValuationDTO> getStockValuation(
            @PathVariable Long productId,
            @PathVariable Long warehouseId) {
        var stock = stockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElse(null);

        if (stock == null) {
            return ResponseEntity.notFound().build();
        }

        // Use stock ledger service for comprehensive valuation
        StockLedgerService.StockValuationSummary summary = stockLedgerService.getCurrentStockValuation(productId,
                warehouseId);

        StockValuationDTO dto = new StockValuationDTO();
        dto.setProductId(productId);
        dto.setWarehouseId(warehouseId);
        dto.setOrgId(stock.getOrgId());
        dto.setCurrentQuantity(summary.currentQuantity);
        dto.setFifoValue(summary.fifoValue);
        dto.setLifoValue(summary.lifoValue);
        dto.setWeightedAvgValue(summary.weightedAvgValue);
        dto.setWeightedAvgCost(summary.weightedAvgCost);
        dto.setValuationDifference(summary.fifoValue.subtract(summary.lifoValue));

        return ResponseEntity.ok(dto);
    }

    /**
     * Calculate COGS for a sale
     */
    @PostMapping("/cogs")
    public ResponseEntity<COGSCalculationDTO> calculateCOGS(
            @RequestParam Long productId,
            @RequestParam Long warehouseId,
            @RequestParam Integer quantity,
            @RequestParam(defaultValue = "FIFO") String strategy) {
        List<InventoryTransaction> transactions = transactionRepository
                .findByProductIdAndWarehouseIdOrderByTransactionDateAsc(productId, warehouseId);

        BigDecimal cogs = valuationContext.calculateCOGS(strategy, transactions, quantity);
        BigDecimal avgCost = cogs.divide(
                BigDecimal.valueOf(quantity),
                4,
                RoundingMode.HALF_UP);

        COGSCalculationDTO dto = new COGSCalculationDTO();
        dto.setProductId(productId);
        dto.setWarehouseId(warehouseId);
        dto.setQuantitySold(quantity);
        dto.setStrategy(strategy);
        dto.setCogsAmount(cogs);
        dto.setAverageCostPerUnit(avgCost);

        return ResponseEntity.ok(dto);
    }

    /**
     * Compare all valuation methods
     */
    @GetMapping("/compare/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<ValuationComparisonDTO> compareValuationMethods(
            @PathVariable Long productId,
            @PathVariable Long warehouseId) {
        var stock = stockRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElse(null);

        if (stock == null) {
            return ResponseEntity.notFound().build();
        }

        StockLedgerService.StockValuationSummary summary = stockLedgerService.getCurrentStockValuation(productId,
                warehouseId);

        ValuationComparisonDTO dto = new ValuationComparisonDTO();
        dto.setProductId(productId);
        dto.setWarehouseId(warehouseId);
        dto.setCurrentQuantity(summary.currentQuantity);
        dto.setFifoValue(summary.fifoValue);
        dto.setLifoValue(summary.lifoValue);
        dto.setWeightedAvgValue(summary.weightedAvgValue);

        // Calculate max difference
        BigDecimal maxDiff = summary.fifoValue.subtract(summary.lifoValue).abs();
        dto.setMaxDifference(maxDiff);

        // Determine recommended method
        if (maxDiff.compareTo(BigDecimal.valueOf(100)) < 0) {
            dto.setRecommendedMethod("WEIGHTED_AVERAGE");
            dto.setReasoning("Low price variance - WEIGHTED_AVERAGE provides simplicity");
        } else if (summary.fifoValue.compareTo(summary.lifoValue) > 0) {
            dto.setRecommendedMethod("FIFO");
            dto.setReasoning("Rising prices - FIFO shows lower COGS and higher profits");
        } else {
            dto.setRecommendedMethod("LIFO");
            dto.setReasoning("Falling prices - LIFO matches recent costs better");
        }

        // Method details
        BigDecimal currentQty = BigDecimal.valueOf(summary.currentQuantity);
        List<ValuationComparisonDTO.ValuationMethodDetail> details = new ArrayList<>();

        BigDecimal avgFifo = summary.currentQuantity > 0
                ? summary.fifoValue.divide(currentQty, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal avgLifo = summary.currentQuantity > 0
                ? summary.lifoValue.divide(currentQty, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        details.add(new ValuationComparisonDTO.ValuationMethodDetail(
                "FIFO", summary.fifoValue, avgFifo,
                "First-In-First-Out: Oldest stock priced first"));
        details.add(new ValuationComparisonDTO.ValuationMethodDetail(
                "LIFO", summary.lifoValue, avgLifo,
                "Last-In-First-Out: Newest stock priced first"));
        details.add(new ValuationComparisonDTO.ValuationMethodDetail(
                "WEIGHTED_AVERAGE", summary.weightedAvgValue,
                summary.weightedAvgCost != null ? summary.weightedAvgCost : BigDecimal.ZERO,
                "Weighted Average: Average cost of all purchases"));
        dto.setMethodDetails(details);

        return ResponseEntity.ok(dto);
    }

    /**
     * Get available valuation strategies
     */
    @GetMapping("/strategies")
    public ResponseEntity<Map<String, Object>> getStrategies() {
        Map<String, Object> result = new HashMap<>();
        result.put("available", valuationContext.getAvailableStrategies());
        result.put("current", valuationContext.getCurrentStrategyName());
        result.put("descriptions", Map.of(
                "FIFO", "First-In-First-Out: Values inventory using oldest purchase costs",
                "LIFO", "Last-In-First-Out: Values inventory using newest purchase costs",
                "WEIGHTED_AVERAGE", "Weighted Average: Uses average cost of all purchases"));
        return ResponseEntity.ok(result);
    }
}
