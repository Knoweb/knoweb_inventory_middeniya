package com.inventory.warehouse.repository;

import com.inventory.warehouse.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByOrgId(Long orgId);
    List<Warehouse> findByBranchId(Long branchId);
    List<Warehouse> findByOrgIdAndIsActiveTrue(Long orgId);
    List<Warehouse> findByBranchIdAndIsActiveTrue(Long branchId);
}
