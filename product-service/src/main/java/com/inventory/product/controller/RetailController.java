package com.inventory.product.controller;

import com.inventory.product.model.RetailProduct;
import com.inventory.product.service.RetailFeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST API for Retail-specific features
 */
@RestController
@RequestMapping("/api/retail")
@RequiredArgsConstructor
@Slf4j
public class RetailController {
    
    private final RetailFeatureService retailFeatureService;
    
    /**
     * Create retail product attributes
     * POST /api/retail
     */
    @PostMapping
    public ResponseEntity<RetailProduct> createRetailProduct(@RequestBody RetailProduct retailProduct) {
        return ResponseEntity.ok(retailFeatureService.createRetailProduct(retailProduct));
    }
    
    /**
     * Update retail product attributes
     * PUT /api/retail/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<RetailProduct> updateRetailProduct(
            @PathVariable Long id,
            @RequestBody RetailProduct retailProduct) {
        return ResponseEntity.ok(retailFeatureService.updateRetailProduct(id, retailProduct));
    }
    
    /**
     * Get retail product by product ID
     * GET /api/retail/product/{productId}
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<RetailProduct> getByProductId(@PathVariable Long productId) {
        return retailFeatureService.getByProductId(productId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all variants for a parent SKU
     * GET /api/retail/variants/{parentSku}
     */
    @GetMapping("/variants/{parentSku}")
    public ResponseEntity<List<RetailProduct>> getVariantsByParentSku(@PathVariable String parentSku) {
        return ResponseEntity.ok(retailFeatureService.getVariantsByParentSku(parentSku));
    }
    
    /**
     * Get specific variant by color and size
     * GET /api/retail/variant?parentSku=SKU123&color=Red&size=M
     */
    @GetMapping("/variant")
    public ResponseEntity<RetailProduct> getVariant(
            @RequestParam String parentSku,
            @RequestParam String color,
            @RequestParam String size) {
        return retailFeatureService.getVariant(parentSku, color, size)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get available sizes for a parent SKU
     * GET /api/retail/{parentSku}/sizes
     */
    @GetMapping("/{parentSku}/sizes")
    public ResponseEntity<List<String>> getAvailableSizes(@PathVariable String parentSku) {
        return ResponseEntity.ok(retailFeatureService.getAvailableSizes(parentSku));
    }
    
    /**
     * Get available colors for a parent SKU
     * GET /api/retail/{parentSku}/colors
     */
    @GetMapping("/{parentSku}/colors")
    public ResponseEntity<List<String>> getAvailableColors(@PathVariable String parentSku) {
        return ResponseEntity.ok(retailFeatureService.getAvailableColors(parentSku));
    }
    
    /**
     * Get products by season
     * GET /api/retail/season/{season}?year=2024
     */
    @GetMapping("/season/{season}")
    public ResponseEntity<List<RetailProduct>> getProductsBySeason(
            @PathVariable String season,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(retailFeatureService.getProductsBySeason(season, year));
    }
    
    /**
     * Get products by collection
     * GET /api/retail/collection/{collectionName}
     */
    @GetMapping("/collection/{collectionName}")
    public ResponseEntity<List<RetailProduct>> getProductsByCollection(
            @PathVariable String collectionName) {
        return ResponseEntity.ok(retailFeatureService.getProductsByCollection(collectionName));
    }
    
    /**
     * Get clearance items
     * GET /api/retail/clearance
     */
    @GetMapping("/clearance")
    public ResponseEntity<List<RetailProduct>> getClearanceItems() {
        return ResponseEntity.ok(retailFeatureService.getClearanceItems());
    }
    
    /**
     * Get products on sale
     * GET /api/retail/on-sale
     */
    @GetMapping("/on-sale")
    public ResponseEntity<List<RetailProduct>> getProductsOnSale() {
        return ResponseEntity.ok(retailFeatureService.getProductsOnSale());
    }
    
    /**
     * Get active promotions
     * GET /api/retail/promotions
     */
    @GetMapping("/promotions")
    public ResponseEntity<List<RetailProduct>> getActivePromotions() {
        return ResponseEntity.ok(retailFeatureService.getActivePromotions());
    }
    
    /**
     * Apply sale pricing
     * POST /api/retail/{id}/sale
     */
    @PostMapping("/{id}/sale")
    public ResponseEntity<RetailProduct> applySale(
            @PathVariable Long id,
            @RequestBody Map<String, Object> saleData) {
        BigDecimal salePrice = new BigDecimal(saleData.get("salePrice").toString());
        BigDecimal discountPercentage = new BigDecimal(saleData.get("discountPercentage").toString());
        return ResponseEntity.ok(retailFeatureService.applySale(id, salePrice, discountPercentage));
    }
    
    /**
     * Apply promotion
     * POST /api/retail/{id}/promotion
     */
    @PostMapping("/{id}/promotion")
    public ResponseEntity<RetailProduct> applyPromotion(
            @PathVariable Long id,
            @RequestBody Map<String, String> promotionData) {
        String promotionCode = promotionData.get("promotionCode");
        LocalDateTime startDate = LocalDateTime.parse(promotionData.get("startDate"));
        LocalDateTime endDate = LocalDateTime.parse(promotionData.get("endDate"));
        return ResponseEntity.ok(retailFeatureService.applyPromotion(id, promotionCode, startDate, endDate));
    }
    
    /**
     * Mark products as clearance
     * POST /api/retail/clearance
     */
    @PostMapping("/clearance")
    public ResponseEntity<String> markAsClearance(@RequestBody Map<String, Object> data) {
        String season = (String) data.get("season");
        Integer year = (Integer) data.get("year");
        retailFeatureService.markAsClearance(season, year);
        return ResponseEntity.ok("Products marked as clearance successfully");
    }
    
    /**
     * Get featured products
     * GET /api/retail/featured
     */
    @GetMapping("/featured")
    public ResponseEntity<List<RetailProduct>> getFeaturedProducts() {
        return ResponseEntity.ok(retailFeatureService.getFeaturedProducts());
    }
    
    /**
     * Get new arrivals
     * GET /api/retail/new-arrivals
     */
    @GetMapping("/new-arrivals")
    public ResponseEntity<List<RetailProduct>> getNewArrivals() {
        return ResponseEntity.ok(retailFeatureService.getNewArrivals());
    }
    
    /**
     * Get bestsellers
     * GET /api/retail/bestsellers
     */
    @GetMapping("/bestsellers")
    public ResponseEntity<List<RetailProduct>> getBestsellers() {
        return ResponseEntity.ok(retailFeatureService.getBestsellers());
    }
    
    /**
     * Get by color family
     * GET /api/retail/color-family/{colorFamily}
     */
    @GetMapping("/color-family/{colorFamily}")
    public ResponseEntity<List<RetailProduct>> getByColorFamily(@PathVariable String colorFamily) {
        return ResponseEntity.ok(retailFeatureService.getByColorFamily(colorFamily));
    }
    
    /**
     * Get by material
     * GET /api/retail/material/{material}
     */
    @GetMapping("/material/{material}")
    public ResponseEntity<List<RetailProduct>> getByMaterial(@PathVariable String material) {
        return ResponseEntity.ok(retailFeatureService.getByMaterial(material));
    }
    
    /**
     * Get all retail products for organization
     * GET /api/retail/organization/{orgId}
     */
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<RetailProduct>> getByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(retailFeatureService.getByOrganization(orgId));
    }
    
    /**
     * Delete retail product
     * DELETE /api/retail/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRetailProduct(@PathVariable Long id) {
        retailFeatureService.deleteRetailProduct(id);
        return ResponseEntity.noContent().build();
    }
}
