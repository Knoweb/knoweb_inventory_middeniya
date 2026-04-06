package com.inventory.product.factory;

import com.inventory.product.model.Product;
import java.util.List;

/**
 * Factory Pattern Interface for Industry-Specific Products
 * Each industry has its own product factory implementation
 */
public interface ProductFactory {
    
    /**
     * Create a product from a template
     * @param template Product template with industry-specific attributes
     * @return Configured product
     */
    Product createProduct(ProductTemplate template);
    
    /**
     * Get predefined templates for this industry
     * @return List of available product templates
     */
    List<ProductTemplate> getAvailableTemplates();
    
    /**
     * Get the industry type this factory handles
     * @return Industry type identifier
     */
    String getIndustryType();
    
    /**
     * Validate product attributes for this industry
     * @param product Product to validate
     * @return true if valid, false otherwise
     */
    boolean validateProduct(Product product);
}
