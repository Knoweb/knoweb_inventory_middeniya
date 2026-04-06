package com.inventory.reporting.repository;

import com.inventory.reporting.model.SalesAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesAnalyticsRepository extends JpaRepository<SalesAnalytics, Long> {
    List<SalesAnalytics> findByOrgId(Long orgId);
    List<SalesAnalytics> findByBranchId(Long branchId);
    List<SalesAnalytics> findByMonthYear(String monthYear);
    List<SalesAnalytics> findBySaleDateBetween(LocalDate start, LocalDate end);
    
    @Query("SELECT SUM(s.totalAmount) FROM SalesAnalytics s WHERE s.orgId = :orgId AND s.monthYear = :monthYear")
    BigDecimal getTotalSalesByMonth(@Param("orgId") Long orgId, @Param("monthYear") String monthYear);
    
    @Query("SELECT SUM(s.totalAmount) FROM SalesAnalytics s WHERE s.orgId = :orgId AND s.saleDate BETWEEN :start AND :end")
    BigDecimal getTotalSalesByDateRange(@Param("orgId") Long orgId, 
                                        @Param("start") LocalDate start, 
                                        @Param("end") LocalDate end);
    
    @Query("SELECT COUNT(s) FROM SalesAnalytics s WHERE s.orgId = :orgId AND s.saleDate BETWEEN :start AND :end")
    Long getTotalOrdersByDateRange(@Param("orgId") Long orgId, 
                                   @Param("start") LocalDate start, 
                                   @Param("end") LocalDate end);
}
