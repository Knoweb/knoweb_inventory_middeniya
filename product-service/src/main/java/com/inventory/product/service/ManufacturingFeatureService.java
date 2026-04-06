package com.inventory.product.service;

import com.inventory.product.model.ManufacturingProduct;
import com.inventory.product.repository.ManufacturingProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for Manufacturing-specific features
 * Handles raw materials tracking and WIP (Work-in-Progress) management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ManufacturingFeatureService {
    
    private final ManufacturingProductRepository manufacturingProductRepository;
    
    /**
     * Create manufacturing product attributes
     */
    public ManufacturingProduct createManufacturingProduct(ManufacturingProduct manufacturingProduct) {
        log.info("Creating manufacturing product for productId: {}, type: {}", 
            manufacturingProduct.getProductId(), manufacturingProduct.getProductType());
        return manufacturingProductRepository.save(manufacturingProduct);
    }
    
    /**
     * Update manufacturing product attributes
     */
    public ManufacturingProduct updateManufacturingProduct(Long id, ManufacturingProduct manufacturingProduct) {
        ManufacturingProduct existing = manufacturingProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Manufacturing product not found with id: " + id));
        
        // Update all fields
        existing.setProductType(manufacturingProduct.getProductType());
        existing.setMaterialCode(manufacturingProduct.getMaterialCode());
        existing.setPartNumber(manufacturingProduct.getPartNumber());
        existing.setRevision(manufacturingProduct.getRevision());
        existing.setMaterialGrade(manufacturingProduct.getMaterialGrade());
        existing.setMaterialSpecification(manufacturingProduct.getMaterialSpecification());
        existing.setSupplierMaterialCode(manufacturingProduct.getSupplierMaterialCode());
        existing.setLotNumber(manufacturingProduct.getLotNumber());
        existing.setHeatNumber(manufacturingProduct.getHeatNumber());
        existing.setCertificateNumber(manufacturingProduct.getCertificateNumber());
        existing.setBomItems(manufacturingProduct.getBomItems());
        existing.setBomLevel(manufacturingProduct.getBomLevel());
        existing.setParentProductId(manufacturingProduct.getParentProductId());
        existing.setWipStatus(manufacturingProduct.getWipStatus());
        existing.setWorkOrderNumber(manufacturingProduct.getWorkOrderNumber());
        existing.setProductionLine(manufacturingProduct.getProductionLine());
        existing.setOperationSequence(manufacturingProduct.getOperationSequence());
        existing.setCurrentOperation(manufacturingProduct.getCurrentOperation());
        existing.setNextOperation(manufacturingProduct.getNextOperation());
        existing.setCompletionPercentage(manufacturingProduct.getCompletionPercentage());
        existing.setMaterialCost(manufacturingProduct.getMaterialCost());
        existing.setLaborCost(manufacturingProduct.getLaborCost());
        existing.setOverheadCost(manufacturingProduct.getOverheadCost());
        existing.setQualityGrade(manufacturingProduct.getQualityGrade());
        existing.setInspectionStatus(manufacturingProduct.getInspectionStatus());
        existing.setManufacturingAttributes(manufacturingProduct.getManufacturingAttributes());
        
        return manufacturingProductRepository.save(existing);
    }
    
    /**
     * Get manufacturing product by product ID
     */
    public Optional<ManufacturingProduct> getByProductId(Long productId) {
        return manufacturingProductRepository.findByProductId(productId);
    }
    
    /**
     * Get products by type (RAW_MATERIAL, WIP, FINISHED_GOOD, COMPONENT)
     */
    public List<ManufacturingProduct> getByProductType(String productType, Long orgId) {
        if (orgId != null) {
            return manufacturingProductRepository.findByOrgIdAndProductType(orgId, productType);
        }
        return manufacturingProductRepository.findByProductType(productType);
    }
    
    /**
     * Get raw materials
     */
    public List<ManufacturingProduct> getRawMaterials(Long orgId) {
        return getByProductType("RAW_MATERIAL", orgId);
    }
    
    /**
     * Get work-in-progress items
     */
    public List<ManufacturingProduct> getWipItems(Long orgId) {
        return getByProductType("WIP", orgId);
    }
    
    /**
     * Get finished goods
     */
    public List<ManufacturingProduct> getFinishedGoods(Long orgId) {
        return getByProductType("FINISHED_GOOD", orgId);
    }
    
    /**
     * Get active WIP items (IN_PROGRESS or ON_HOLD)
     */
    public List<ManufacturingProduct> getActiveWipItems() {
        return manufacturingProductRepository.findActiveWipItems();
    }
    
    /**
     * Get overdue WIP items
     */
    public List<ManufacturingProduct> getOverdueWipItems() {
        return manufacturingProductRepository.findOverdueWipItems();
    }
    
    /**
     * Get WIP by status
     */
    public List<ManufacturingProduct> getWipByStatus(String status) {
        return manufacturingProductRepository.findByWipStatus(status);
    }
    
    /**
     * Get by work order
     */
    public List<ManufacturingProduct> getByWorkOrder(String workOrderNumber) {
        return manufacturingProductRepository.findByWorkOrderNumber(workOrderNumber);
    }
    
    /**
     * Get by production line
     */
    public List<ManufacturingProduct> getByProductionLine(String productionLine) {
        return manufacturingProductRepository.findByProductionLine(productionLine);
    }
    
    /**
     * Update WIP status
     */
    public ManufacturingProduct updateWipStatus(Long id, String newStatus) {
        ManufacturingProduct product = manufacturingProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Manufacturing product not found"));
        
        String oldStatus = product.getWipStatus();
        product.setWipStatus(newStatus);
        
        if ("COMPLETED".equals(newStatus)) {
            product.setWipCompletionDate(LocalDateTime.now());
            product.setCompletionPercentage(java.math.BigDecimal.valueOf(100));
        } else if ("IN_PROGRESS".equals(newStatus) && product.getWipStartDate() == null) {
            product.setWipStartDate(LocalDateTime.now());
        }
        
        log.info("Updated WIP status for product {}: {} -> {}", id, oldStatus, newStatus);
        
        return manufacturingProductRepository.save(product);
    }
    
    /**
     * Get components for a parent product (BOM explosion)
     */
    public List<ManufacturingProduct> getComponents(Long parentProductId) {
        return manufacturingProductRepository.findByParentProductId(parentProductId);
    }
    
    /**
     * Get products by BOM level
     */
    public List<ManufacturingProduct> getByBomLevel(Integer level) {
        return manufacturingProductRepository.findByBomLevel(level);
    }
    
    /**
     * Get by material code
     */
    public List<ManufacturingProduct> getByMaterialCode(String materialCode) {
        return manufacturingProductRepository.findByMaterialCode(materialCode);
    }
    
    /**
     * Get by lot number (for traceability)
     */
    public List<ManufacturingProduct> getByLotNumber(String lotNumber) {
        return manufacturingProductRepository.findByLotNumber(lotNumber);
    }
    
    /**
     * Get pending inspection items
     */
    public List<ManufacturingProduct> getPendingInspection() {
        return manufacturingProductRepository.findPendingInspection();
    }
    
    /**
     * Update inspection result
     */
    public ManufacturingProduct updateInspection(Long id, String inspectionStatus, 
                                                 String qualityGrade, Integer defectCount) {
        ManufacturingProduct product = manufacturingProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Manufacturing product not found"));
        
        product.setInspectionStatus(inspectionStatus);
        product.setQualityGrade(qualityGrade);
        product.setInspectionDate(LocalDateTime.now());
        product.setDefectCount(defectCount);
        
        if ("FAILED".equals(inspectionStatus) && defectCount != null && defectCount > 0) {
            product.setReworkRequired(true);
        }
        
        log.info("Updated inspection for product {}: status={}, grade={}, defects={}", 
            id, inspectionStatus, qualityGrade, defectCount);
        
        return manufacturingProductRepository.save(product);
    }
    
    /**
     * Get items requiring rework
     */
    public List<ManufacturingProduct> getItemsRequiringRework() {
        return manufacturingProductRepository.findByReworkRequiredTrue();
    }
    
    /**
     * Get items with excessive rework
     */
    public List<ManufacturingProduct> getExcessiveRework(Integer maxRework) {
        return manufacturingProductRepository.findExcessiveRework(maxRework);
    }
    
   /**
     * Get all manufacturing products for organization
     */
    public List<ManufacturingProduct> getByOrganization(Long orgId) {
        return manufacturingProductRepository.findByOrgId(orgId);
    }
    
    /**
     * Delete manufacturing product
     */
    public void deleteManufacturingProduct(Long id) {
        manufacturingProductRepository.deleteById(id);
    }
}
