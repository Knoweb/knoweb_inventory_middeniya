package com.inventory.inventoryservice.repository;

import com.inventory.inventoryservice.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByProductId(Long productId);
    List<InventoryTransaction> findByWarehouseId(Long warehouseId);
    List<InventoryTransaction> findByOrgId(Long orgId);
    List<InventoryTransaction> findByReferenceId(String referenceId);
    
    List<InventoryTransaction> findByProductIdAndWarehouseIdOrderByTransactionDateAsc(Long productId, Long warehouseId);
    List<InventoryTransaction> findByProductIdAndWarehouseIdOrderByTransactionDateDesc(Long productId, Long warehouseId);
    
    List<InventoryTransaction> findByProductIdOrderByTransactionDateAsc(Long productId);
}
