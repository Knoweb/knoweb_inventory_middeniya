package com.inventory.reporting.controller;

import com.inventory.reporting.model.InventoryAnalytics;
import com.inventory.reporting.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // Inventory Analytics
    @GetMapping("/inventory/{orgId}")
    public ResponseEntity<List<?>> getInventoryAnalytics(@PathVariable Long orgId) {
        return ResponseEntity.ok(analyticsService.getInventoryAnalytics(orgId));
    }

    @GetMapping("/inventory/{orgId}/summary")
    public ResponseEntity<Map<String, Object>> getInventorySummary(@PathVariable Long orgId) {
        return ResponseEntity.ok(analyticsService.getInventorySummary(orgId));
    }

    @GetMapping("/inventory/{orgId}/low-stock")
    public ResponseEntity<List<InventoryAnalytics>> getLowStockProducts(@PathVariable Long orgId) {
        return ResponseEntity.ok(analyticsService.getLowStockProducts(orgId));
    }

    // Sales Analytics
    @GetMapping("/sales/{orgId}")
    public ResponseEntity<List<?>> getSalesAnalytics(@PathVariable Long orgId) {
        return ResponseEntity.ok(analyticsService.getSalesAnalytics(orgId));
    }

    @GetMapping("/sales/{orgId}/summary")
    public ResponseEntity<Map<String, Object>> getSalesSummary(
            @PathVariable Long orgId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getSalesSummary(orgId, startDate, endDate));
    }

    @GetMapping("/sales/{orgId}/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlySales(
            @PathVariable Long orgId,
            @RequestParam String monthYear) {
        return ResponseEntity.ok(analyticsService.getMonthlySales(orgId, monthYear));
    }

    // Dashboard
    @GetMapping("/dashboard/{orgId}")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics(@PathVariable Long orgId) {
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(orgId));
    }
}
