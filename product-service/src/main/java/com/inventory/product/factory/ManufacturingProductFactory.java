package com.inventory.product.factory;

import com.inventory.product.model.Product;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

/**
 * Factory for Manufacturing Products
 * Handles raw materials, components, and finished goods
 */
@Component
public class ManufacturingProductFactory implements ProductFactory {
    
    @Override
    public Product createProduct(ProductTemplate template) {
        Product product = new Product();
        product.setName(template.getName());
        product.setCategory(template.getCategory());
        product.setDescription(template.getDescription());
        product.setPrice(template.getBasePrice());
        product.setIndustryType("MANUFACTURING");
        
        // Generate SKU with MFG prefix
        product.setSku("MFG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        // Set industry-specific attributes as JSON
        Map<String, Object> attributes = template.getIndustrySpecificAttributes();
        if (attributes != null) {
            product.setIndustrySpecificAttributes(new HashMap<>(attributes));
            if (attributes.containsKey("manufacturer")) {
                product.setBrand((String) attributes.get("manufacturer"));
            }
        }
        
        return product;
    }
    
    @Override
    public List<ProductTemplate> getAvailableTemplates() {
        List<ProductTemplate> templates = new ArrayList<>();
        
        // Template 1: Raw Material
        ProductTemplate rawMaterial = new ProductTemplate();
        rawMaterial.setName("Raw Material Template");
        rawMaterial.setCategory("RAW_MATERIALS");
        rawMaterial.setIndustryType("MANUFACTURING");
        rawMaterial.setBasePrice(BigDecimal.valueOf(15.00));
        
        Map<String, Object> rawAttrs = new HashMap<>();
        rawAttrs.put("unit", "KG");
        rawAttrs.put("grade", "A");
        rawAttrs.put("hazardous", false);
        rawMaterial.setIndustrySpecificAttributes(rawAttrs);
        
        templates.add(rawMaterial);
        
        // Template 2: Component
        ProductTemplate component = new ProductTemplate();
        component.setName("Component Template");
        component.setCategory("COMPONENTS");
        component.setIndustryType("MANUFACTURING");
        component.setBasePrice(BigDecimal.valueOf(45.00));
        
        Map<String, Object> compAttrs = new HashMap<>();
        compAttrs.put("partNumber", "COMP-001");
        compAttrs.put("leadTime", "7 days");
        compAttrs.put("moq", 100);
        component.setIndustrySpecificAttributes(compAttrs);
        
        templates.add(component);
        
        // Template 3: Finished Goods
        ProductTemplate finishedGoods = new ProductTemplate();
        finishedGoods.setName("Finished Goods Template");
        finishedGoods.setCategory("FINISHED_GOODS");
        finishedGoods.setIndustryType("MANUFACTURING");
        finishedGoods.setBasePrice(BigDecimal.valueOf(150.00));
        
        Map<String, Object> fgAttrs = new HashMap<>();
        fgAttrs.put("bomReference", "BOM-001");
        fgAttrs.put("qualityGrade", "Premium");
        finishedGoods.setIndustrySpecificAttributes(fgAttrs);
        
        templates.add(finishedGoods);
        
        return templates;
    }
    
    @Override
    public String getIndustryType() {
        return "MANUFACTURING";
    }
    
    @Override
    public boolean validateProduct(Product product) {
        if (product.getSku() != null && !product.getSku().startsWith("MFG-")) {
            return false;
        }
        
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        
        return true;
    }
}
