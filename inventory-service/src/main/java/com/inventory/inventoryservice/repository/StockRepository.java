package com.inventory.inventoryservice.repository;

import com.inventory.inventoryservice.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProductIdAndWarehouseId(Long productId, Long warehouseId);
    
    // ✅ CRITICAL FIX #2: Pessimistic locking to prevent race conditions
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.productId = ?1 AND s.warehouseId = ?2")
    Optional<Stock> findByProductIdAndWarehouseIdWithLock(Long productId, Long warehouseId);

    List<Stock> findByProductId(Long productId);

    List<Stock> findByWarehouseId(Long warehouseId);

    List<Stock> findByOrgId(Long orgId);

    long countByOrgId(Long orgId);
}
