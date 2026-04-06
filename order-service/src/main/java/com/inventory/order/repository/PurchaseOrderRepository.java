package com.inventory.order.repository;

import com.inventory.order.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByOrgId(Long orgId);
    List<PurchaseOrder> findBySupplierId(Long supplierId);
}
