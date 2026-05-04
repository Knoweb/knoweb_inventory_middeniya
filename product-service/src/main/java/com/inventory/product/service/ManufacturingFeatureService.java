package com.inventory.product.service;

import com.inventory.product.model.ManufacturingProduct;
import com.inventory.product.repository.ManufacturingProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
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
    private final org.springframework.web.client.RestTemplate restTemplate;

    private static final String INVENTORY_SERVICE_URL = "http://inventory-service/api/inventory/transactions";

    /**
     * Create manufacturing product attributes and deduct stock from inventory
     */
    public ManufacturingProduct createManufacturingProduct(ManufacturingProduct manufacturingProduct) {
        log.info("Creating manufacturing product for productId: {}, type: {}", 
            manufacturingProduct.getProductId(), manufacturingProduct.getProductType());
        
        // Deduct from inventory if it's a WIP or Molding product
        log.info("Checking if stock deduction is needed for product: {}, Type: {}, WIP Status: {}", 
            manufacturingProduct.getProductId(), manufacturingProduct.getProductType(), manufacturingProduct.getWipStatus());

        // Check if this is a recovered/split batch to avoid double-deduction
        boolean isRecovered = false;
        if (manufacturingProduct.getManufacturingAttributes() != null && 
            manufacturingProduct.getManufacturingAttributes().get("isRecovered") != null) {
            Object recoveredFlag = manufacturingProduct.getManufacturingAttributes().get("isRecovered");
            if (recoveredFlag instanceof Boolean) {
                isRecovered = (Boolean) recoveredFlag;
            } else if (recoveredFlag instanceof String) {
                isRecovered = Boolean.parseBoolean((String) recoveredFlag);
            }
        }

        if (!isRecovered && ("WIP_MOLDING".equals(manufacturingProduct.getWipStatus()) || 
            "MOLDING".equals(manufacturingProduct.getProductType()))) {
            
            try {
                log.info("Attempting to deduct stock from inventory for product ID: {} with quantity: {}", 
                    manufacturingProduct.getProductId(), manufacturingProduct.getManufacturingAttributes() != null ? manufacturingProduct.getManufacturingAttributes().get("quantity") : "unknown");
                
                Map<String, Object> transaction = new HashMap<>();
                transaction.put("productId", manufacturingProduct.getProductId());
                
                // Try to get quantity from manufacturingAttributes or default to 1 if not found
                Object qty = 1;
                if (manufacturingProduct.getManufacturingAttributes() != null && manufacturingProduct.getManufacturingAttributes().get("quantity") != null) {
                    qty = manufacturingProduct.getManufacturingAttributes().get("quantity");
                }
                transaction.put("quantity", qty);
                transaction.put("type", "OUT");
                transaction.put("orgId", manufacturingProduct.getOrgId());
                
                // DYNAMIC WAREHOUSE FETCH: Find where this product actually has stock
                Long dynamicWarehouseId = 1L; // Default fallback
                try {
                    log.info("Fetching stock info from inventory-service to find warehouse for product ID: {}", manufacturingProduct.getProductId());
                    // Fix URL: Ensure it points to /api/inventory/stocks/product/{id}
                    String stockUrl = INVENTORY_SERVICE_URL.replace("/transactions", "/stocks") + "/product/" + manufacturingProduct.getProductId();
                    log.info("Stock lookup URL: {}", stockUrl);
                    
                    Object[] stocks = restTemplate.getForObject(stockUrl, Object[].class);
                    
                    if (stocks != null && stocks.length > 0) {
                        log.info("Found {} stock entries for product", stocks.length);
                        // Find the first warehouse that has this product for this org
                        for (Object s : stocks) {
                            Map<String, Object> stockMap = (Map<String, Object>) s;
                            // Check orgId and also ensure quantity is > 0 if possible
                            if (stockMap.get("orgId").toString().equals(manufacturingProduct.getOrgId().toString())) {
                                dynamicWarehouseId = Long.valueOf(stockMap.get("warehouseId").toString());
                                log.info("Matching stock found in warehouse ID: {}", dynamicWarehouseId);
                                break;
                            }
                        }
                    } else {
                        log.warn("No stock records found for product ID: {} in any warehouse", manufacturingProduct.getProductId());
                    }
                } catch (Exception e) {
                    log.warn("Could not fetch dynamic warehouse ID, falling back to 1: {}", e.getMessage());
                }
                
                transaction.put("warehouseId", dynamicWarehouseId);
                
                String batchNum = "N/A";
                if (manufacturingProduct.getManufacturingAttributes() != null && 
                    manufacturingProduct.getManufacturingAttributes().get("batchNumber") != null) {
                    batchNum = String.valueOf(manufacturingProduct.getManufacturingAttributes().get("batchNumber"));
                }
                
                transaction.put("remarks", "Molding Batch Auto-Deduction: " + batchNum);

                log.info("Sending transaction to inventory-service: {}", transaction);
                restTemplate.postForObject(INVENTORY_SERVICE_URL, transaction, Object.class);
                log.info("Successfully sent deduction request to inventory-service");
                
            } catch (Exception e) {
                log.error("Failed to deduct stock from inventory: {}", e.getMessage());
                // We don't throw exception here to prevent blocking the WIP creation, 
                // but in production we might want to handle this more strictly.
            }
        } else {
            log.info("No stock deduction needed for this product type/status");
        }

        // Set wipStartDate if not already set
        if (manufacturingProduct.getWipStartDate() == null && manufacturingProduct.getWipStatus() != null) {
            manufacturingProduct.setWipStartDate(LocalDateTime.now());
        }
        
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
        existing.setDefectCount(manufacturingProduct.getDefectCount());
        existing.setDefectDescription(manufacturingProduct.getDefectDescription());
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
        
        // Set start date if not already set (for any WIP status)
        if (product.getWipStartDate() == null && newStatus != null && !newStatus.isEmpty()) {
            product.setWipStartDate(LocalDateTime.now());
        }
        
        if ("COMPLETED".equals(newStatus)) {
            product.setWipCompletionDate(LocalDateTime.now());
            product.setCompletionPercentage(java.math.BigDecimal.valueOf(100));
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
     * Get completed inspection items
     */
    public List<ManufacturingProduct> getCompletedInspections() {
        return manufacturingProductRepository.findCompletedInspections();
    }
    
    /**
     * Update inspection result
     */
    public ManufacturingProduct updateInspection(Long id, String inspectionStatus, 
                                                 String qualityGrade, Integer defectCount) {
        ManufacturingProduct product = manufacturingProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Manufacturing product not found"));
        
        Integer totalSentToQc = product.getDefectCount();
        Integer recoveredQty = defectCount;
        
        product.setInspectionStatus(inspectionStatus);
        product.setQualityGrade(qualityGrade);
        product.setInspectionDate(LocalDateTime.now());
        product.setDefectCount(defectCount);

        // Update Scrap Totals based on what was lost during QC
        if (product.getManufacturingAttributes() != null) {
            String lastStage = (String) product.getManufacturingAttributes().get("lastStage");
            int qcScrap = 0;
            
            if ("FAILED".equals(inspectionStatus)) {
                qcScrap = totalSentToQc != null ? totalSentToQc : 0;
            } else if ("PASSED".equals(inspectionStatus)) {
                qcScrap = (totalSentToQc != null ? totalSentToQc : 0) - (recoveredQty != null ? recoveredQty : 0);
            }

            product.getManufacturingAttributes().put("lastQcScrap", qcScrap);

            if (qcScrap > 0) {
                String scrapKey = "moldingScrap";
                if ("ASSEMBLE".equals(lastStage)) scrapKey = "assembleScrap";
                else if ("PRIMARY".equals(lastStage)) scrapKey = "primaryScrap";
                
                Object currentVal = product.getManufacturingAttributes().get(scrapKey);
                int currentScrap = (currentVal instanceof Number) ? ((Number) currentVal).intValue() : 0;
                product.getManufacturingAttributes().put(scrapKey, currentScrap + qcScrap);
                
                // Also update the global scrap counter if it exists
                Object globalVal = product.getManufacturingAttributes().get("scrapRecorded");
                int globalScrap = (globalVal instanceof Number) ? ((Number) globalVal).intValue() : 0;
                product.getManufacturingAttributes().put("scrapRecorded", globalScrap + qcScrap);
            }
        }
        
        if ("FAILED".equals(inspectionStatus)) {
            product.setReworkRequired(true);
            product.setWipStatus("SCRAPPED"); // Mark as completely scrapped
        } else if ("PASSED".equals(inspectionStatus)) {
            product.setReworkRequired(false);
            
            if (product.getManufacturingAttributes() != null && defectCount != null) {
                product.getManufacturingAttributes().put("quantity", defectCount);
                
                String lastStage = (String) product.getManufacturingAttributes().get("lastStage");
                if ("MOLDING".equals(lastStage)) {
                    product.getManufacturingAttributes().put("moldingPassedQty", defectCount);
                    product.setWipStatus("WIP_ASSEMBLE");
                } else if ("ASSEMBLE".equals(lastStage)) {
                    product.getManufacturingAttributes().put("assemblePassedQty", defectCount);
                    product.setWipStatus("WIP_PRIMARY");
                } else if ("PRIMARY".equals(lastStage)) {
                    product.getManufacturingAttributes().put("primaryPassedQty", defectCount);
                    product.setWipStatus("FINISHED_GOOD");
                } else {
                    String desc = product.getDefectDescription();
                    if (desc != null && desc.contains("Molding")) product.setWipStatus("WIP_ASSEMBLE");
                    else if (desc != null && desc.contains("Assembling")) product.setWipStatus("WIP_PRIMARY");
                    else product.setWipStatus("FINISHED_GOOD");
                }
            }
        }
        
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
