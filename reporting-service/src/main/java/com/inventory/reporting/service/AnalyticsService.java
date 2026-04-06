package com.inventory.reporting.service;

import com.inventory.reporting.model.InventoryAnalytics;
import com.inventory.reporting.model.SalesAnalytics;
import com.inventory.reporting.repository.InventoryAnalyticsRepository;
import com.inventory.reporting.repository.SalesAnalyticsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AnalyticsService {

    @Autowired
    private InventoryAnalyticsRepository inventoryRepo;

    @Autowired
    private SalesAnalyticsRepository salesRepo;

    @Autowired
    private com.inventory.reporting.client.InventoryClient inventoryClient;

    @Autowired
    private com.inventory.reporting.client.OrderClient orderClient;

    // Inventory Analytics
    public List<Object> getInventoryAnalytics(Long orgId) {
        try {
            List<Object> stocks = inventoryClient.getStocks(orgId);
            if (stocks != null && !stocks.isEmpty()) {
                return stocks;
            }
        } catch (Exception e) {
            log.error("Failed to fetch real-time stocks: {}", e.getMessage());
        }
        return inventoryRepo.findByOrgId(orgId).stream().map(i -> (Object) i).toList();
    }

    public List<InventoryAnalytics> getLowStockProducts(Long orgId) {
        LocalDate today = LocalDate.now();
        return inventoryRepo.findByOrgIdAndDate(orgId, today).stream()
                .filter(InventoryAnalytics::getIsLowStock)
                .toList();
    }

    public Map<String, Object> getInventorySummary(Long orgId) {
        LocalDate today = LocalDate.now();
        Map<String, Object> summary = new HashMap<>();

        Double totalValue = inventoryRepo.getTotalStockValue(orgId, today);
        Long lowStockCount = inventoryRepo.getLowStockCount(orgId, today);
        List<InventoryAnalytics> allProducts = inventoryRepo.findByOrgIdAndDate(orgId, today);

        summary.put("totalStockValue", totalValue != null ? totalValue : 0.0);
        summary.put("lowStockCount", lowStockCount != null ? lowStockCount : 0L);
        summary.put("totalProducts", allProducts.size());
        summary.put("snapshotDate", today);

        return summary;
    }

    // Sales Analytics
    public List<Object> getSalesAnalytics(Long orgId) {
        try {
            List<Object> orders = orderClient.getSalesOrders(orgId);
            if (orders != null && !orders.isEmpty()) {
                return orders;
            }
        } catch (Exception e) {
            log.error("Failed to fetch real-time sales orders: {}", e.getMessage());
        }
        return salesRepo.findByOrgId(orgId).stream().map(i -> (Object) i).toList();
    }

    public Map<String, Object> getSalesSummary(Long orgId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> summary = new HashMap<>();

        // Fetch real-time data
        BigDecimal totalSales = BigDecimal.ZERO;
        Long totalOrders = 0L;

        try {
            List<Object> orders = orderClient.getSalesOrders(orgId);
            if (orders != null) {
                totalOrders = (long) orders.size();
                for (Object obj : orders) {
                    if (obj instanceof Map) {
                        Map<String, Object> orderMap = (Map<String, Object>) obj;
                        Object amount = orderMap.get("totalAmount");
                        if (amount != null) {
                            totalSales = totalSales.add(new BigDecimal(amount.toString()));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch real-time sales summary: {}", e.getMessage());
            totalSales = salesRepo.getTotalSalesByDateRange(orgId, startDate, endDate);
            totalOrders = salesRepo.getTotalOrdersByDateRange(orgId, startDate, endDate);
        }

        if (totalSales == null || totalSales.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal repoSales = salesRepo.getTotalSalesByDateRange(orgId, startDate, endDate);
            if (repoSales != null)
                totalSales = repoSales;
        }

        summary.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        summary.put("totalOrders", totalOrders != null ? totalOrders : 0L);
        summary.put("averageOrderValue",
                (totalOrders != null && totalOrders > 0 && totalSales != null)
                        ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, BigDecimal.ROUND_HALF_UP)
                        : BigDecimal.ZERO);
        summary.put("startDate", startDate);
        summary.put("endDate", endDate);

        return summary;
    }

    public Map<String, Object> getMonthlySales(Long orgId, String monthYear) {
        Map<String, Object> summary = new HashMap<>();

        BigDecimal totalSales = salesRepo.getTotalSalesByMonth(orgId, monthYear);
        List<SalesAnalytics> sales = salesRepo.findByMonthYear(monthYear);

        summary.put("month", monthYear);
        summary.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        summary.put("orderCount", sales.size());

        return summary;
    }

    public Map<String, Object> getDashboardMetrics(Long orgId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("inventory", getInventorySummary(orgId));
        metrics.put("salesThisMonth", getSalesSummary(orgId, monthStart, today));

        // Fetch real-time low stock alerts from Inventory Service
        Long lowStockCount;
        try {
            lowStockCount = inventoryClient.getLowStockCount(orgId);
        } catch (Exception e) {
            lowStockCount = (long) getLowStockProducts(orgId).size();
        }
        metrics.put("lowStockAlerts", lowStockCount);

        return metrics;
    }
}
