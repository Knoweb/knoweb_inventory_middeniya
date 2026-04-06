package com.inventory.product.service;

import com.inventory.product.enums.IndustryType;
import com.inventory.product.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

/**
 * Service to configure and manage industry-specific features
 * This service acts as an orchestrator between Product and industry-specific tables
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class IndustryFeatureConfigService {
    
    private final PharmacyFeatureService pharmacyFeatureService;
    private final RetailFeatureService retailFeatureService;
    private final ManufacturingFeatureService manufacturingFeatureService;
    
    /**
     * Get enabled features for an industry type
     */
    public IndustryType.IndustryFeatures getEnabledFeatures(IndustryType industryType) {
        return industryType.getFeatures();
    }
    
    /**
     * Check if a specific feature is enabled for an industry
     */
    public boolean isFeatureEnabled(IndustryType industryType, String featureName) {
        IndustryType.IndustryFeatures features = industryType.getFeatures();
        
        return switch (featureName.toLowerCase()) {
            case "batch_tracking" -> features.batchTracking;
            case "expiry_dates" -> features.expiryDates;
            case "prescription_only" -> features.prescriptionOnly;
            case "size_color_variants" -> features.sizeColorVariants;
            case "seasonal_tracking" -> features.seasonalTracking;
            case "promotions_and_discounts" -> features.promotionsAndDiscounts;
            case "raw_materials_tracking" -> features.rawMaterialsTracking;
            case "wip_tracking" -> features.wipTracking;
            default -> false;
        };
    }
    
    /**
     * Get all available industry types
     */
    public List<Map<String, Object>> getAllIndustryTypes() {
        List<Map<String, Object>> industryList = new ArrayList<>();
        
        for (IndustryType type : IndustryType.values()) {
            Map<String, Object> industryInfo = new HashMap<>();
            industryInfo.put("type", type.name());
            industryInfo.put("features", type.getFeatures());
            industryList.add(industryInfo);
        }
        
        return industryList;
    }
    
    /**
     * Create industry-specific attributes for a product
     */
    public Object createIndustryAttributes(Long productId, IndustryType industryType, Object attributes) {
        log.info("Creating industry attributes for productId: {}, industry: {}", productId, industryType);
        
        return switch (industryType) {
            case PHARMACY -> {
                if (attributes instanceof PharmacyProduct pharmacyProduct) {
                    pharmacyProduct.setProductId(productId);
                    yield pharmacyFeatureService.createPharmacyProduct(pharmacyProduct);
                }
                throw new IllegalArgumentException("Attributes must be PharmacyProduct for PHARMACY industry");
            }
            case RETAIL -> {
                if (attributes instanceof RetailProduct retailProduct) {
                    retailProduct.setProductId(productId);
                    yield retailFeatureService.createRetailProduct(retailProduct);
                }
                throw new IllegalArgumentException("Attributes must be RetailProduct for RETAIL industry");
            }
            case MANUFACTURING -> {
                if (attributes instanceof ManufacturingProduct manufacturingProduct) {
                    manufacturingProduct.setProductId(productId);
                    yield manufacturingFeatureService.createManufacturingProduct(manufacturingProduct);
                }
                throw new IllegalArgumentException("Attributes must be ManufacturingProduct for MANUFACTURING industry");
            }
            case GENERAL -> null;
        };
    }
    
    /**
     * Get industry-specific attributes for a product
     */
    public Optional<?> getIndustryAttributes(Long productId, IndustryType industryType) {
        return switch (industryType) {
            case PHARMACY -> pharmacyFeatureService.getByProductId(productId);
            case RETAIL -> retailFeatureService.getByProductId(productId);
            case MANUFACTURING -> manufacturingFeatureService.getByProductId(productId);
            case GENERAL -> Optional.empty();
        };
    }
    
    /**
     * Delete industry-specific attributes for a product
     */
    public void deleteIndustryAttributes(Long productId, IndustryType industryType) {
        log.info("Deleting industry attributes for productId: {}, industry: {}", productId, industryType);
        
        switch (industryType) {
            case PHARMACY -> {
                pharmacyFeatureService.getByProductId(productId)
                    .ifPresent(p -> pharmacyFeatureService.deletePharmacyProduct(p.getId()));
            }
            case RETAIL -> {
                retailFeatureService.getByProductId(productId)
                    .ifPresent(p -> retailFeatureService.deleteRetailProduct(p.getId()));
            }
            case MANUFACTURING -> {
                manufacturingFeatureService.getByProductId(productId)
                    .ifPresent(p -> manufacturingFeatureService.deleteManufacturingProduct(p.getId()));
            }
            case GENERAL -> {
                // No industry-specific attributes to delete
            }
        }
    }
    
    /**
     * Validate that required industry features are present
     */
    public boolean validateIndustryAttributes(IndustryType industryType, Object attributes) {
        if (industryType == IndustryType.GENERAL) {
            return true;
        }
        
        return switch (industryType) {
            case PHARMACY -> attributes instanceof PharmacyProduct;
            case RETAIL -> attributes instanceof RetailProduct;
            case MANUFACTURING -> attributes instanceof ManufacturingProduct;
            default -> false;
        };
    }
    
    /**
     * Get recommended industry type based on product attributes
     */
    public IndustryType recommendIndustryType(Map<String, Object> productAttributes) {
        // Check for pharmacy indicators
        if (productAttributes.containsKey("batchNumber") || 
            productAttributes.containsKey("expiryDate") ||
            productAttributes.containsKey("isPrescriptionRequired")) {
            return IndustryType.PHARMACY;
        }
        
        // Check for retail indicators
        if (productAttributes.containsKey("colorName") ||
            productAttributes.containsKey("sizeValue") ||
            productAttributes.containsKey("season")) {
            return IndustryType.RETAIL;
        }
        
        // Check for manufacturing indicators
        if (productAttributes.containsKey("bomItems") ||
            productAttributes.containsKey("wipStatus") ||
            productAttributes.containsKey("workOrderNumber")) {
            return IndustryType.MANUFACTURING;
        }
        
        return IndustryType.GENERAL;
    }
    
    /**
     * Get feature summary for all industries
     */
    public Map<String, Object> getFeatureSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        for (IndustryType type : IndustryType.values()) {
            Map<String, Object> typeInfo = new HashMap<>();
            typeInfo.put("name", type.name());
            
            IndustryType.IndustryFeatures features = type.getFeatures();
            List<String> enabledFeatures = new ArrayList<>();
            
            if (features.batchTracking) enabledFeatures.add("Batch Tracking");
            if (features.expiryDates) enabledFeatures.add("Expiry Dates");
            if (features.prescriptionOnly) enabledFeatures.add("Prescription Management");
            if (features.sizeColorVariants) enabledFeatures.add("Size/Color Variants");
            if (features.seasonalTracking) enabledFeatures.add("Seasonal Tracking");
            if (features.promotionsAndDiscounts) enabledFeatures.add("Promotions & Discounts");
            if (features.rawMaterialsTracking) enabledFeatures.add("Raw Materials Tracking");
            if (features.wipTracking) enabledFeatures.add("WIP Tracking");
            
            typeInfo.put("features", enabledFeatures);
            summary.put(type.name(), typeInfo);
        }
        
        return summary;
    }
}
