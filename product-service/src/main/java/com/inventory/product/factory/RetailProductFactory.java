package com.inventory.product.factory;

import com.inventory.product.model.Product;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

/**
 * Factory for Retail Products
 * Handles general retail merchandise
 */
@Component
public class RetailProductFactory implements ProductFactory {
    
    @Override
    public Product createProduct(ProductTemplate template) {
        Product product = new Product();
        product.setName(template.getName());
        product.setCategory(template.getCategory());
        product.setDescription(template.getDescription());
        product.setPrice(template.getBasePrice());
        product.setIndustryType("RETAIL");
        
        // Generate SKU with RETAIL prefix
        product.setSku("RETAIL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        // Set industry-specific attributes as JSON
        Map<String, Object> attributes = template.getIndustrySpecificAttributes();
        if (attributes != null) {
            product.setIndustrySpecificAttributes(new HashMap<>(attributes));
            if (attributes.containsKey("brand")) {
                product.setBrand((String) attributes.get("brand"));
            }
        }
        
        return product;
    }
    
    @Override
    public List<ProductTemplate> getAvailableTemplates() {
        List<ProductTemplate> templates = new ArrayList<>();
        
        // Template 1: Apparel
        ProductTemplate apparel = new ProductTemplate();
        apparel.setName("Apparel Template");
        apparel.setCategory("CLOTHING");
        apparel.setIndustryType("RETAIL");
        apparel.setBasePrice(BigDecimal.valueOf(29.99));
        
        Map<String, Object> apparelAttrs = new HashMap<>();
        apparelAttrs.put("size", "M");
        apparelAttrs.put("color", "Blue");
        apparelAttrs.put("material", "Cotton");
        apparelAttrs.put("season", "All Season");
        apparel.setIndustrySpecificAttributes(apparelAttrs);
        
        templates.add(apparel);
        
        // Template 2: Electronics
        ProductTemplate electronics = new ProductTemplate();
        electronics.setName("Electronics Template");
        electronics.setCategory("ELECTRONICS");
        electronics.setIndustryType("RETAIL");
        electronics.setBasePrice(BigDecimal.valueOf(99.99));
        
        Map<String, Object> elecAttrs = new HashMap<>();
        elecAttrs.put("warranty", "1 year");
        elecAttrs.put("powerRating", "110V");
        electronics.setIndustrySpecificAttributes(elecAttrs);
        
        templates.add(electronics);
        
        // Template 3: Home & Garden
        ProductTemplate homeGarden = new ProductTemplate();
        homeGarden.setName("Home & Garden Template");
        homeGarden.setCategory("HOME_GARDEN");
        homeGarden.setIndustryType("RETAIL");
        homeGarden.setBasePrice(BigDecimal.valueOf(19.99));
        
        templates.add(homeGarden);
        
        return templates;
    }
    
    @Override
    public String getIndustryType() {
        return "RETAIL";
    }
    
    @Override
    public boolean validateProduct(Product product) {
        if (product.getSku() != null && !product.getSku().startsWith("RETAIL-")) {
            return false;
        }
        
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        
        return true;
    }
}
