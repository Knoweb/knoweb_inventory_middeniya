package com.inventory.product.controller;

import com.inventory.product.model.ManufacturingProduct;
import com.inventory.product.service.ManufacturingFeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST API for Manufacturing-specific features
 */
@RestController
@RequestMapping("/api/manufacturing")
@RequiredArgsConstructor
@Slf4j
public class ManufacturingController {
    
    private final ManufacturingFeatureService manufacturingFeatureService;
    
    /**
     * Create manufacturing product attributes
     * POST /api/manufacturing
     */
    @PostMapping
    public ResponseEntity<ManufacturingProduct> createManufacturingProduct(
            @RequestBody ManufacturingProduct manufacturingProduct) {
        return ResponseEntity.ok(manufacturingFeatureService.createManufacturingProduct(manufacturingProduct));
    }
    
    /**
     * Update manufacturing product attributes
     * PUT /api/manufacturing/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ManufacturingProduct> updateManufacturingProduct(
            @PathVariable Long id,
            @RequestBody ManufacturingProduct manufacturingProduct) {
        return ResponseEntity.ok(manufacturingFeatureService.updateManufacturingProduct(id, manufacturingProduct));
    }
    
    /**
     * Get manufacturing product by product ID
     * GET /api/manufacturing/product/{productId}
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ManufacturingProduct> getByProductId(@PathVariable Long productId) {
        return manufacturingFeatureService.getByProductId(productId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get products by type
     * GET /api/manufacturing/type/{productType}?orgId=1
     */
    @GetMapping("/type/{productType}")
    public ResponseEntity<List<ManufacturingProduct>> getByProductType(
            @PathVariable String productType,
            @RequestParam(required = false) Long orgId) {
        return ResponseEntity.ok(manufacturingFeatureService.getByProductType(productType, orgId));
    }
    
    /**
     * Get raw materials
     * GET /api/manufacturing/raw-materials?orgId=1
     */
    @GetMapping("/raw-materials")
    public ResponseEntity<List<ManufacturingProduct>> getRawMaterials(
            @RequestParam(required = false) Long orgId) {
        return ResponseEntity.ok(manufacturingFeatureService.getRawMaterials(orgId));
    }
    
    /**
     * Get work-in-progress items
     * GET /api/manufacturing/wip?orgId=1
     */
    @GetMapping("/wip")
    public ResponseEntity<List<ManufacturingProduct>> getWipItems(
            @RequestParam(required = false) Long orgId) {
        return ResponseEntity.ok(manufacturingFeatureService.getWipItems(orgId));
    }
    
    /**
     * Get finished goods
     * GET /api/manufacturing/finished-goods?orgId=1
     */
    @GetMapping("/finished-goods")
    public ResponseEntity<List<ManufacturingProduct>> getFinishedGoods(
            @RequestParam(required = false) Long orgId) {
        return ResponseEntity.ok(manufacturingFeatureService.getFinishedGoods(orgId));
    }
    
    /**
     * Get active WIP items
     * GET /api/manufacturing/wip/active
     */
    @GetMapping("/wip/active")
    public ResponseEntity<List<ManufacturingProduct>> getActiveWipItems() {
        return ResponseEntity.ok(manufacturingFeatureService.getActiveWipItems());
    }
    
    /**
     * Get overdue WIP items
     * GET /api/manufacturing/wip/overdue
     */
    @GetMapping("/wip/overdue")
    public ResponseEntity<List<ManufacturingProduct>> getOverdueWipItems() {
        return ResponseEntity.ok(manufacturingFeatureService.getOverdueWipItems());
    }
    
    /**
     * Get WIP by status
     * GET /api/manufacturing/wip/status/{status}
     */
    @GetMapping("/wip/status/{status}")
    public ResponseEntity<List<ManufacturingProduct>> getWipByStatus(@PathVariable String status) {
        return ResponseEntity.ok(manufacturingFeatureService.getWipByStatus(status));
    }
    
    /**
     * Update WIP status
     * POST /api/manufacturing/{id}/wip-status
     */
    @PostMapping("/{id}/wip-status")
    public ResponseEntity<ManufacturingProduct> updateWipStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        return ResponseEntity.ok(manufacturingFeatureService.updateWipStatus(id, newStatus));
    }
    
    /**
     * Get by work order
     * GET /api/manufacturing/work-order/{workOrderNumber}
     */
    @GetMapping("/work-order/{workOrderNumber}")
    public ResponseEntity<List<ManufacturingProduct>> getByWorkOrder(
            @PathVariable String workOrderNumber) {
        return ResponseEntity.ok(manufacturingFeatureService.getByWorkOrder(workOrderNumber));
    }
    
    /**
     * Get by production line
     * GET /api/manufacturing/production-line/{productionLine}
     */
    @GetMapping("/production-line/{productionLine}")
    public ResponseEntity<List<ManufacturingProduct>> getByProductionLine(
            @PathVariable String productionLine) {
        return ResponseEntity.ok(manufacturingFeatureService.getByProductionLine(productionLine));
    }
    
    /**
     * Get components for a parent product (BOM explosion)
     * GET /api/manufacturing/bom/{parentProductId}
     */
    @GetMapping("/bom/{parentProductId}")
    public ResponseEntity<List<ManufacturingProduct>> getComponents(@PathVariable Long parentProductId) {
        return ResponseEntity.ok(manufacturingFeatureService.getComponents(parentProductId));
    }
    
    /**
     * Get by BOM level
     * GET /api/manufacturing/bom-level/{level}
     */
    @GetMapping("/bom-level/{level}")
    public ResponseEntity<List<ManufacturingProduct>> getByBomLevel(@PathVariable Integer level) {
        return ResponseEntity.ok(manufacturingFeatureService.getByBomLevel(level));
    }
    
    /**
     * Get by material code
     * GET /api/manufacturing/material/{materialCode}
     */
    @GetMapping("/material/{materialCode}")
    public ResponseEntity<List<ManufacturingProduct>> getByMaterialCode(
            @PathVariable String materialCode) {
        return ResponseEntity.ok(manufacturingFeatureService.getByMaterialCode(materialCode));
    }
    
    /**
     * Get by lot number (for traceability)
     * GET /api/manufacturing/lot/{lotNumber}
     */
    @GetMapping("/lot/{lotNumber}")
    public ResponseEntity<List<ManufacturingProduct>> getByLotNumber(@PathVariable String lotNumber) {
        return ResponseEntity.ok(manufacturingFeatureService.getByLotNumber(lotNumber));
    }
    
    /**
     * Get pending inspection items
     * GET /api/manufacturing/inspection/pending
     */
    @GetMapping("/inspection/pending")
    public ResponseEntity<List<ManufacturingProduct>> getPendingInspection() {
        return ResponseEntity.ok(manufacturingFeatureService.getPendingInspection());
    }
    
    /**
     * Update inspection result
     * POST /api/manufacturing/{id}/inspection
     */
    @PostMapping("/{id}/inspection")
    public ResponseEntity<ManufacturingProduct> updateInspection(
            @PathVariable Long id,
            @RequestBody Map<String, Object> inspectionData) {
        String status = (String) inspectionData.get("status");
        String grade = (String) inspectionData.get("grade");
        Integer defectCount = inspectionData.get("defectCount") != null 
            ? ((Number) inspectionData.get("defectCount")).intValue() 
            : null;
        
        return ResponseEntity.ok(manufacturingFeatureService.updateInspection(id, status, grade, defectCount));
    }
    
    /**
     * Get items requiring rework
     * GET /api/manufacturing/rework/required
     */
    @GetMapping("/rework/required")
    public ResponseEntity<List<ManufacturingProduct>> getItemsRequiringRework() {
        return ResponseEntity.ok(manufacturingFeatureService.getItemsRequiringRework());
    }
    
    /**
     * Get items with excessive rework
     * GET /api/manufacturing/rework/excessive?maxRework=3
     */
    @GetMapping("/rework/excessive")
    public ResponseEntity<List<ManufacturingProduct>> getExcessiveRework(
            @RequestParam(defaultValue = "3") Integer maxRework) {
        return ResponseEntity.ok(manufacturingFeatureService.getExcessiveRework(maxRework));
    }
    
    /**
     * Get all manufacturing products for organization
     * GET /api/manufacturing/organization/{orgId}
     */
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<ManufacturingProduct>> getByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(manufacturingFeatureService.getByOrganization(orgId));
    }
    
    /**
     * Delete manufacturing product
     * DELETE /api/manufacturing/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteManufacturingProduct(@PathVariable Long id) {
        manufacturingFeatureService.deleteManufacturingProduct(id);
        return ResponseEntity.noContent().build();
    }
}
