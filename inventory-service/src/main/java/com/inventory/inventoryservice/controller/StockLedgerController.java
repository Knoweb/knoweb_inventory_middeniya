package com.inventory.inventoryservice.controller;

import com.inventory.inventoryservice.dto.StockLedgerDTO;
import com.inventory.inventoryservice.model.StockLedger;
import com.inventory.inventoryservice.service.StockLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Stock Ledger operations
 */
@RestController
@RequestMapping("/api/inventory/ledger")
@RequiredArgsConstructor
public class StockLedgerController {
    
    private final StockLedgerService stockLedgerService;
    
    /**
     * Get stock ledger for a product-warehouse
     */
    @GetMapping("/product/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<List<StockLedgerDTO>> getStockLedger(
        @PathVariable Long productId,
        @PathVariable Long warehouseId
    ) {
        List<StockLedger> ledger = stockLedgerService.getLedger(productId, warehouseId);
        List<StockLedgerDTO> dtos = ledger.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Get latest ledger entry
     */
    @GetMapping("/product/{productId}/warehouse/{warehouseId}/latest")
    public ResponseEntity<StockLedgerDTO> getLatestEntry(
        @PathVariable Long productId,
        @PathVariable Long warehouseId
    ) {
        StockLedger entry = stockLedgerService.getLatestEntry(productId, warehouseId);
        if (entry == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToDTO(entry));
    }
    
    /**
     * Get ledger for date range
     */
    @GetMapping("/product/{productId}/warehouse/{warehouseId}/range")
    public ResponseEntity<List<StockLedgerDTO>> getLedgerByDateRange(
        @PathVariable Long productId,
        @PathVariable Long warehouseId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<StockLedger> ledger = stockLedgerService.getLedgerByDateRange(
            productId, warehouseId, startDate, endDate
        );
        List<StockLedgerDTO> dtos = ledger.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Get organization ledger
     */
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<StockLedgerDTO>> getOrganizationLedger(
        @PathVariable Long orgId
    ) {
        List<StockLedger> ledger = stockLedgerService.getOrganizationLedger(orgId);
        List<StockLedgerDTO> dtos = ledger.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Get current stock valuation summary
     */
    @GetMapping("/product/{productId}/warehouse/{warehouseId}/valuation")
    public ResponseEntity<Map<String, Object>> getCurrentValuation(
        @PathVariable Long productId,
        @PathVariable Long warehouseId
    ) {
        StockLedgerService.StockValuationSummary summary = 
            stockLedgerService.getCurrentStockValuation(productId, warehouseId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("productId", summary.productId);
        response.put("warehouseId", summary.warehouseId);
        response.put("currentQuantity", summary.currentQuantity);
        response.put("fifoValue", summary.fifoValue);
        response.put("lifoValue", summary.lifoValue);
        response.put("weightedAvgValue", summary.weightedAvgValue);
        response.put("weightedAvgCost", summary.weightedAvgCost);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Rebuild stock ledger
     */
    @PostMapping("/rebuild/product/{productId}/warehouse/{warehouseId}")
    public ResponseEntity<Map<String, String>> rebuildLedger(
        @PathVariable Long productId,
        @PathVariable Long warehouseId
    ) {
        stockLedgerService.rebuildLedger(productId, warehouseId);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Stock ledger rebuilt successfully");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get weighted average cost
     */
    @GetMapping("/product/{productId}/warehouse/{warehouseId}/average-cost")
    public ResponseEntity<Map<String, Object>> getWeightedAverageCost(
        @PathVariable Long productId,
        @PathVariable Long warehouseId
    ) {
        var avgCost = stockLedgerService.calculateWeightedAverageCost(productId, warehouseId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId);
        response.put("warehouseId", warehouseId);
        response.put("weightedAverageCost", avgCost);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Convert entity to DTO
     */
    private StockLedgerDTO convertToDTO(StockLedger ledger) {
        StockLedgerDTO dto = new StockLedgerDTO();
        dto.setId(ledger.getId());
        dto.setProductId(ledger.getProductId());
        dto.setWarehouseId(ledger.getWarehouseId());
        dto.setTransactionType(ledger.getTransactionType());
        dto.setTransactionDate(ledger.getTransactionDate());
        dto.setQuantityIn(ledger.getQuantityIn());
        dto.setQuantityOut(ledger.getQuantityOut());
        dto.setQuantityBalance(ledger.getQuantityBalance());
        dto.setUnitCost(ledger.getUnitCost());
        dto.setTotalCost(ledger.getTotalCost());
        dto.setRunningBalance(ledger.getRunningBalance());
        dto.setWeightedAvgCost(ledger.getWeightedAvgCost());
        dto.setReferenceId(ledger.getReferenceId());
        dto.setNotes(ledger.getNotes());
        return dto;
    }
}
