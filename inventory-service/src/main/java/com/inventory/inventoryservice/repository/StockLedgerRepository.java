package com.inventory.inventoryservice.repository;

import com.inventory.inventoryservice.model.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {

       List<StockLedger> findByProductIdAndWarehouseIdOrderByTransactionDateAsc(Long productId, Long warehouseId);

       List<StockLedger> findByProductIdAndWarehouseIdOrderByTransactionDateDesc(Long productId, Long warehouseId);

       List<StockLedger> findByOrgIdOrderByTransactionDateDesc(Long orgId);

       Optional<StockLedger> findTopByProductIdAndWarehouseIdOrderByTransactionDateDesc(Long productId,
                     Long warehouseId);

       @Query("SELECT sl FROM StockLedger sl WHERE sl.productId = :productId AND sl.warehouseId = :warehouseId " +
                     "AND sl.transactionDate BETWEEN :startDate AND :endDate ORDER BY sl.transactionDate ASC")
       List<StockLedger> findByProductWarehouseAndDateRange(@Param("productId") Long productId,
                     @Param("warehouseId") Long warehouseId,
                     @Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);

       @Query("SELECT sl FROM StockLedger sl WHERE sl.orgId = :orgId " +
                     "AND sl.transactionDate BETWEEN :startDate AND :endDate ORDER BY sl.transactionDate DESC")
       List<StockLedger> findByOrgAndDateRange(@Param("orgId") Long orgId,
                     @Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);
}
