package com.inventory.product.repository;

import com.inventory.product.model.ManufacturingProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ManufacturingProductRepository extends JpaRepository<ManufacturingProduct, Long> {
    
    Optional<ManufacturingProduct> findByProductId(Long productId);
    
    List<ManufacturingProduct> findByOrgId(Long orgId);
    
    // Product Type Classification
    List<ManufacturingProduct> findByProductType(String productType);
    
    List<ManufacturingProduct> findByOrgIdAndProductType(Long orgId, String productType);
    
    List<ManufacturingProduct> findByPartNumber(String partNumber);
    
    // Raw Material Tracking
    List<ManufacturingProduct> findByMaterialCode(String materialCode);
    
    List<ManufacturingProduct> findByLotNumber(String lotNumber);
    
    List<ManufacturingProduct> findBySupplierMaterialCode(String supplierMaterialCode);
    
    // WIP Tracking
    List<ManufacturingProduct> findByWipStatus(String wipStatus);
    
    List<ManufacturingProduct> findByWorkOrderNumber(String workOrderNumber);
    
    List<ManufacturingProduct> findByProductionLine(String productionLine);
    
    @Query("SELECT m FROM ManufacturingProduct m WHERE m.wipStatus IN ('IN_PROGRESS', 'ON_HOLD')")
    List<ManufacturingProduct> findActiveWipItems();
    
    @Query("SELECT m FROM ManufacturingProduct m WHERE m.estimatedCompletionDate < CURRENT_TIMESTAMP AND m.wipStatus = 'IN_PROGRESS'")
    List<ManufacturingProduct> findOverdueWipItems();
    
    // BOM and Hierarchy
    List<ManufacturingProduct> findByParentProductId(Long parentProductId);
    
    @Query("SELECT m FROM ManufacturingProduct m WHERE m.bomLevel = :level")
    List<ManufacturingProduct> findByBomLevel(@Param("level") Integer level);
    
    // Quality Control
    List<ManufacturingProduct> findByInspectionStatus(String inspectionStatus);
    
    List<ManufacturingProduct> findByQualityGrade(String qualityGrade);
    
    List<ManufacturingProduct> findByReworkRequiredTrue();
    
    @Query("SELECT m FROM ManufacturingProduct m WHERE m.inspectionStatus = 'PENDING'")
    List<ManufacturingProduct> findPendingInspection();
    
    @Query("SELECT m FROM ManufacturingProduct m WHERE m.reworkCount > :maxRework")
    List<ManufacturingProduct> findExcessiveRework(@Param("maxRework") Integer maxRework);
    
    // Machine and Production
    List<ManufacturingProduct> findByMachineId(String machineId);
    
    List<ManufacturingProduct> findByProductionLineAndWipStatus(String productionLine, String wipStatus);
    
    // Traceability
    List<ManufacturingProduct> findBySerialNumberRequiredTrue();
    
    List<ManufacturingProduct> findByBatchTrackingRequiredTrue();
    
    List<ManufacturingProduct> findByTraceabilityLevel(String traceabilityLevel);
}
