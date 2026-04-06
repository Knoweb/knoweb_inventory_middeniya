package com.inventory.order.repository;

import com.inventory.order.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    List<SalesOrder> findByOrgId(Long orgId);

    long countByOrgId(Long orgId);
}
