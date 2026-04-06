package com.inventory.product.factory;

import com.inventory.product.model.Product;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

/**
 * Factory for Pharmacy Products
 * Handles pharmaceutical products with specific attributes
 */
@Component
public class PharmacyProductFactory implements ProductFactory {
    
    @Override
    public Product createProduct(ProductTemplate template) {
        Product product = new Product();
        product.setName(template.getName());
        product.setCategory(template.getCategory());
        product.setDescription(template.getDescription());
        product.setPrice(template.getBasePrice());
        product.setIndustryType("PHARMACY");
        
        // Generate SKU with PHARM prefix
        product.setSku("PHARM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        // Set industry-specific attributes as JSON
        Map<String, Object> attributes = template.getIndustrySpecificAttributes();
        if (attributes != null) {
            product.setIndustrySpecificAttributes(new HashMap<>(attributes));
            // Also set brand if present
            if (attributes.containsKey("brand")) {
                product.setBrand((String) attributes.get("brand"));
            }
        }
        
        return product;
    }
    
    @Override
    public List<ProductTemplate> getAvailableTemplates() {
        List<ProductTemplate> templates = new ArrayList<>();
        
        // Template 1: Prescription Medication
        ProductTemplate prescription = new ProductTemplate();
        prescription.setName("Prescription Medication Template");
        prescription.setCategory("PRESCRIPTION_DRUGS");
        prescription.setIndustryType("PHARMACY");
        prescription.setBasePrice(BigDecimal.valueOf(25.00));
        
        Map<String, Object> prescAttrs = new HashMap<>();
        prescAttrs.put("prescriptionRequired", true);
        prescAttrs.put("dosageForm", "Tablet");
        prescAttrs.put("controlledSubstance", false);
        prescription.setIndustrySpecificAttributes(prescAttrs);
        
        prescription.setRequiredFields(new String[]{
            "activeIngredient", "strength", "dosageForm", "prescriptionRequired"
        });
        templates.add(prescription);
        
        // Template 2: OTC Medication
        ProductTemplate otc = new ProductTemplate();
        otc.setName("OTC Medication Template");
        otc.setCategory("OTC_DRUGS");
        otc.setIndustryType("PHARMACY");
        otc.setBasePrice(BigDecimal.valueOf(12.00));
        
        Map<String, Object> otcAttrs = new HashMap<>();
        otcAttrs.put("prescriptionRequired", false);
        otcAttrs.put("dosageForm", "Tablet");
        otcAttrs.put("ageRestriction", false);
        otc.setIndustrySpecificAttributes(otcAttrs);
        
        templates.add(otc);
        
        // Template 3: Medical Supplies
        ProductTemplate supplies = new ProductTemplate();
        supplies.setName("Medical Supplies Template");
        supplies.setCategory("MEDICAL_SUPPLIES");
        supplies.setIndustryType("PHARMACY");
        supplies.setBasePrice(BigDecimal.valueOf(8.00));
        
        Map<String, Object> supplyAttrs = new HashMap<>();
        supplyAttrs.put("sterile", true);
        supplyAttrs.put("disposable", true);
        supplies.setIndustrySpecificAttributes(supplyAttrs);
        
        templates.add(supplies);
        
        return templates;
    }
    
    @Override
    public String getIndustryType() {
        return "PHARMACY";
    }
    
    @Override
    public boolean validateProduct(Product product) {
        // Pharmacy-specific validation
        if (product.getSku() != null && !product.getSku().startsWith("PHARM-")) {
            return false;
        }
        
        // Price must be positive
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        
        return true;
    }
}
