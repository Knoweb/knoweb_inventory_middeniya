package com.inventory.product.controller;

import com.inventory.product.dto.PharmacyStatsDTO;
import com.inventory.product.model.PharmacyProduct;
import com.inventory.product.service.PharmacyFeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST API for Pharmacy-specific features
 */
@RestController
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
@Slf4j
public class PharmacyController {

    private final PharmacyFeatureService pharmacyFeatureService;

    /**
     * Create pharmacy product attributes
     * POST /api/pharmacy
     */
    @PostMapping
    public ResponseEntity<PharmacyProduct> createPharmacyProduct(@RequestBody PharmacyProduct pharmacyProduct) {
        return ResponseEntity.ok(pharmacyFeatureService.createPharmacyProduct(pharmacyProduct));
    }

    /**
     * Update pharmacy product attributes
     * PUT /api/pharmacy/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<PharmacyProduct> updatePharmacyProduct(
            @PathVariable Long id,
            @RequestBody PharmacyProduct pharmacyProduct) {
        return ResponseEntity.ok(pharmacyFeatureService.updatePharmacyProduct(id, pharmacyProduct));
    }

    /**
     * Get pharmacy product by product ID
     * GET /api/pharmacy/product/{productId}
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<PharmacyProduct> getByProductId(@PathVariable Long productId) {
        return pharmacyFeatureService.getByProductId(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get by batch number
     * GET /api/pharmacy/batch/{batchNumber}
     */
    @GetMapping("/batch/{batchNumber}")
    public ResponseEntity<List<PharmacyProduct>> getByBatchNumber(@PathVariable String batchNumber) {
        return ResponseEntity.ok(pharmacyFeatureService.getByBatchNumber(batchNumber));
    }

    /**
     * Get products expiring within specified days
     * GET /api/pharmacy/expiring?days=30
     */
    @GetMapping("/expiring")
    public ResponseEntity<List<PharmacyProduct>> getExpiringProducts(
            @RequestParam Integer days,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getProductsExpiringWithinDays(orgId, days));
    }

    /**
     * Get products expiring between dates
     * GET /api/pharmacy/expiring-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/expiring-range")
    public ResponseEntity<List<PharmacyProduct>> getExpiringBetween(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return ResponseEntity.ok(pharmacyFeatureService.getProductsExpiringBetween(orgId, start, end));
    }

    /**
     * Get expired products
     * GET /api/pharmacy/expired
     */
    @GetMapping("/expired")
    public ResponseEntity<List<PharmacyProduct>> getExpiredProducts(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getExpiredProducts(orgId));
    }

    /**
     * Get prescription products
     * GET /api/pharmacy/prescription?required=true
     */
    @GetMapping("/prescription")
    public ResponseEntity<List<PharmacyProduct>> getPrescriptionProducts(
            @RequestParam Boolean required,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getPrescriptionProducts(orgId, required));
    }

    /**
     * Get controlled substances by schedule
     * GET /api/pharmacy/controlled?schedule=II
     */
    @GetMapping("/controlled")
    public ResponseEntity<List<PharmacyProduct>> getControlledSubstances(
            @RequestParam String schedule,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getControlledSubstances(orgId, schedule));
    }

    /**
     * Get by active ingredient
     * GET /api/pharmacy/ingredient/{ingredient}
     */
    @GetMapping("/ingredient/{ingredient}")
    public ResponseEntity<List<PharmacyProduct>> getByActiveIngredient(
            @PathVariable String ingredient,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getByActiveIngredient(orgId, ingredient));
    }

    /**
     * Get products requir ing refrigeration
     * GET /api/pharmacy/refrigerated
     */
    @GetMapping("/refrigerated")
    public ResponseEntity<List<PharmacyProduct>> getRefrigeratedProducts(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getRefrigeratedProducts(orgId));
    }

    /**
     * Get recalled products
     * GET /api/pharmacy/recalled?orgId=1
     */
    @GetMapping("/recalled")
    public ResponseEntity<List<PharmacyProduct>> getRecalledProducts(
            @RequestParam(required = false) Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getRecalledProducts(orgId));
    }

    /**
     * Mark product as recalled
     * POST /api/pharmacy/{id}/recall
     */
    @PostMapping("/{id}/recall")
    public ResponseEntity<PharmacyProduct> recallProduct(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String reason = payload.get("reason");
        return ResponseEntity.ok(pharmacyFeatureService.recallProduct(id, reason));
    }

    /**
     * Update expiry statuses for all products
     * POST /api/pharmacy/update-expiry-statuses
     */
    @PostMapping("/update-expiry-statuses")
    public ResponseEntity<String> updateExpiryStatuses(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        pharmacyFeatureService.updateExpiryStatuses(orgId);
        return ResponseEntity.ok("Expiry statuses updated successfully");
    }

    /**
     * Get all pharmacy products for organization
     * GET /api/pharmacy/organization/{orgId}
     */
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<PharmacyProduct>> getByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getByOrganization(orgId));
    }

    /**
     * Delete pharmacy product
     * DELETE /api/pharmacy/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePharmacyProduct(@PathVariable Long id) {
        pharmacyFeatureService.deletePharmacyProduct(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get pharmacy stats for organization
     * GET /api/pharmacy/stats/{orgId}
     */
    @GetMapping("/stats/{orgId}")
    public ResponseEntity<PharmacyStatsDTO> getPharmacyStats(@PathVariable Long orgId) {
        return ResponseEntity.ok(pharmacyFeatureService.getPharmacyStats(orgId));
    }

    /**
     * Sync legacy products to pharmacy table
     * POST /api/pharmacy/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<String> syncPharmacyData(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        pharmacyFeatureService.syncPharmacyData(orgId);
        return ResponseEntity.ok("Pharmacy data synced successfully");
    }
}
