package com.inventory.reporting.repository;

import com.inventory.reporting.model.InventoryAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryAnalyticsRepository extends JpaRepository<InventoryAnalytics, Long> {
    List<InventoryAnalytics> findByOrgId(Long orgId);
    List<InventoryAnalytics> findByBranchId(Long branchId);
    List<InventoryAnalytics> findByCategory(String category);
    List<InventoryAnalytics> findByIsLowStock(Boolean isLowStock);
    List<InventoryAnalytics> findBySnapshotDate(LocalDate date);
    
    @Query("SELECT i FROM InventoryAnalytics i WHERE i.orgId = :orgId AND i.snapshotDate = :date")
    List<InventoryAnalytics> findByOrgIdAndDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT SUM(i.stockValue) FROM InventoryAnalytics i WHERE i.orgId = :orgId AND i.snapshotDate = :date")
    Double getTotalStockValue(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(i) FROM InventoryAnalytics i WHERE i.orgId = :orgId AND i.isLowStock = true AND i.snapshotDate = :date")
    Long getLowStockCount(@Param("orgId") Long orgId, @Param("date") LocalDate date);
}
