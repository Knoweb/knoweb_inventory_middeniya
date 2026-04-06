package com.inventory.product.enums;

/**
 * Industry Type Enum
 * Defines supported industry verticals with specific feature sets
 */
public enum IndustryType {
    PHARMACY("Pharmacy", "Pharmaceutical and healthcare products"),
    RETAIL("Retail", "Consumer retail products"),
    MANUFACTURING("Manufacturing", "Industrial and manufacturing products"),
    GENERAL("General", "Generic inventory management");
    
    private final String displayName;
    private final String description;
    
    IndustryType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Get industry-specific features enabled for this type
     */
    public IndustryFeatures getFeatures() {
        switch (this) {
            case PHARMACY:
                return new IndustryFeatures(true, true, true, false, false, false, false, false);
            case RETAIL:
                return new IndustryFeatures(false, false, false, true, true, true, false, false);
            case MANUFACTURING:
                return new IndustryFeatures(false, false, false, false, false, false, true, true);
            default:
                return new IndustryFeatures(false, false, false, false, false, false, false, false);
        }
    }
    
    /**
     * Inner class representing enabled features per industry
     */
    public static class IndustryFeatures {
        public final boolean batchTracking;
        public final boolean expiryDates;
        public final boolean prescriptionOnly;
        public final boolean sizeColorVariants;
        public final boolean seasonalTracking;
        public final boolean promotionsAndDiscounts;
        public final boolean rawMaterialsTracking;
        public final boolean wipTracking;
        
        public IndustryFeatures(boolean batchTracking, boolean expiryDates, boolean prescriptionOnly,
                               boolean sizeColorVariants, boolean seasonalTracking, boolean promotionsAndDiscounts,
                               boolean rawMaterialsTracking, boolean wipTracking) {
            this.batchTracking = batchTracking;
            this.expiryDates = expiryDates;
            this.prescriptionOnly = prescriptionOnly;
            this.sizeColorVariants = sizeColorVariants;
            this.seasonalTracking = seasonalTracking;
            this.promotionsAndDiscounts = promotionsAndDiscounts;
            this.rawMaterialsTracking = rawMaterialsTracking;
            this.wipTracking = wipTracking;
        }
    }
}
