package com.inventory.product.controller;

import com.inventory.product.enums.IndustryType;
import com.inventory.product.service.IndustryFeatureConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST API for industry feature configuration
 */
@RestController
@RequestMapping("/api/industry-config")
@RequiredArgsConstructor
@Slf4j
public class IndustryConfigController {
    
    private final IndustryFeatureConfigService industryFeatureConfigService;
    
    /**
     * Get all available industry types and their features
     * GET /api/industry-config/types
     */
    @GetMapping("/types")
    public ResponseEntity<List<Map<String, Object>>> getAllIndustryTypes() {
        return ResponseEntity.ok(industryFeatureConfigService.getAllIndustryTypes());
    }
    
    /**
     * Get enabled features for a specific industry type
     * GET /api/industry-config/features/{industryType}
     */
    @GetMapping("/features/{industryType}")
    public ResponseEntity<IndustryType.IndustryFeatures> getEnabledFeatures(
            @PathVariable String industryType) {
        IndustryType type = IndustryType.valueOf(industryType.toUpperCase());
        return ResponseEntity.ok(industryFeatureConfigService.getEnabledFeatures(type));
    }
    
    /**
     * Check if a specific feature is enabled
     * GET /api/industry-config/check?industry=PHARMACY&feature=batch_tracking
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkFeature(
            @RequestParam String industry,
            @RequestParam String feature) {
        IndustryType type = IndustryType.valueOf(industry.toUpperCase());
        boolean enabled = industryFeatureConfigService.isFeatureEnabled(type, feature);
        return ResponseEntity.ok(Map.of("enabled", enabled));
    }
    
    /**
     * Get industry-specific attributes for a product
     * GET /api/industry-config/attributes/{productId}?industry=PHARMACY
     */
    @GetMapping("/attributes/{productId}")
    public ResponseEntity<?> getIndustryAttributes(
            @PathVariable Long productId,
            @RequestParam String industry) {
        IndustryType type = IndustryType.valueOf(industry.toUpperCase());
        return industryFeatureConfigService.getIndustryAttributes(productId, type)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Delete industry-specific attributes
     * DELETE /api/industry-config/attributes/{productId}?industry=PHARMACY
     */
    @DeleteMapping("/attributes/{productId}")
    public ResponseEntity<Void> deleteIndustryAttributes(
            @PathVariable Long productId,
            @RequestParam String industry) {
        IndustryType type = IndustryType.valueOf(industry.toUpperCase());
        industryFeatureConfigService.deleteIndustryAttributes(productId, type);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get recommended industry type for product attributes
     * POST /api/industry-config/recommend
     */
    @PostMapping("/recommend")
    public ResponseEntity<Map<String, String>> recommendIndustryType(
            @RequestBody Map<String, Object> productAttributes) {
        IndustryType recommended = industryFeatureConfigService.recommendIndustryType(productAttributes);
        return ResponseEntity.ok(Map.of("recommendedIndustry", recommended.name()));
    }
    
    /**
     * Get feature summary for all industries
     * GET /api/industry-config/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getFeatureSummary() {
        return ResponseEntity.ok(industryFeatureConfigService.getFeatureSummary());
    }
}
