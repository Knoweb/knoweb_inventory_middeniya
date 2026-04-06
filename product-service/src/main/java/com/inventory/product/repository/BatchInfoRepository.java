package com.inventory.product.repository;

import com.inventory.product.model.BatchInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BatchInfoRepository extends JpaRepository<BatchInfo, Long> {
    List<BatchInfo> findByProductId(Long productId);
    List<BatchInfo> findByBatchNumber(String batchNumber);
}
