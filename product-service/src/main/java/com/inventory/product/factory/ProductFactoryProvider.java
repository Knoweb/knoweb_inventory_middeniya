package com.inventory.product.factory;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Provider/Registry for Product Factories
 * Manages different factory implementations and provides factory selection
 */
@Service
public class ProductFactoryProvider {
    
    private final Map<String, ProductFactory> factories = new HashMap<>();
    
    public ProductFactoryProvider(
        PharmacyProductFactory pharmacyFactory,
        RetailProductFactory retailFactory,
        ManufacturingProductFactory manufacturingFactory
    ) {
        factories.put("PHARMACY", pharmacyFactory);
        factories.put("RETAIL", retailFactory);
        factories.put("MANUFACTURING", manufacturingFactory);
    }
    
    /**
     * Get factory for a specific industry type
     * @param industryType Industry type (PHARMACY, RETAIL, MANUFACTURING, etc.)
     * @return ProductFactory instance
     */
    public ProductFactory getFactory(String industryType) {
        ProductFactory factory = factories.get(industryType);
        if (factory == null) {
            // Default to retail factory
            factory = factories.get("RETAIL");
        }
        return factory;
    }
    
    /**
     * Register a new factory
     * @param industryType Industry type identifier
     * @param factory Factory implementation
     */
    public void registerFactory(String industryType, ProductFactory factory) {
        factories.put(industryType, factory);
    }
    
    /**
     * Get all available industry types
     * @return List of supported industry types
     */
    public List<String> getAvailableIndustries() {
        return List.copyOf(factories.keySet());
    }
    
    /**
     * Check if factory exists for industry type
     * @param industryType Industry type to check
     * @return true if factory exists
     */
    public boolean hasFactory(String industryType) {
        return factories.containsKey(industryType);
    }
}
