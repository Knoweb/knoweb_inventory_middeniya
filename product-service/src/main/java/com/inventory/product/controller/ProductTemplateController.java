package com.inventory.product.controller;

import com.inventory.product.factory.*;
import com.inventory.product.model.Product;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * REST Controller for Product Factory Pattern
 * Manages industry-specific product templates and creation
 */
@RestController
@RequestMapping("/api/products/templates")
@RequiredArgsConstructor
public class ProductTemplateController {
    
    private final ProductFactoryProvider factoryProvider;
    private final ProductRepository productRepository;
    
    /**
     * Get all available industries
     */
    @GetMapping("/industries")
    public ResponseEntity<Map<String, Object>> getIndustries() {
        Map<String, Object> result = new HashMap<>();
        result.put("industries", factoryProvider.getAvailableIndustries());
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get templates for specific industry
     */
    @GetMapping("/industry/{industryType}")
    public ResponseEntity<Map<String, Object>> getTemplatesByIndustry(@PathVariable String industryType) {
        if (!factoryProvider.hasFactory(industryType)) {
            return ResponseEntity.notFound().build();
        }
        
        ProductFactory factory = factoryProvider.getFactory(industryType);
        List<ProductTemplate> templates = factory.getAvailableTemplates();
        
        Map<String, Object> result = new HashMap<>();
        result.put("industryType", industryType);
        result.put("templates", templates);
        result.put("count", templates.size());
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Create product from template
     */
    @PostMapping("/create")
    public ResponseEntity<Product> createFromTemplate(
        @RequestBody ProductTemplate template,
        @RequestParam(required = false) Long orgId
    ) {
        if (template.getIndustryType() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        ProductFactory factory = factoryProvider.getFactory(template.getIndustryType());
        Product product = factory.createProduct(template);
        
        if (orgId != null) {
            product.setOrgId(orgId);
        }
        
        // Validate before saving
        if (!factory.validateProduct(product)) {
            return ResponseEntity.badRequest().build();
        }
        
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }
    
    /**
     * Validate product for specific industry
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateProduct(
        @RequestBody Product product,
        @RequestParam String industryType
    ) {
        ProductFactory factory = factoryProvider.getFactory(industryType);
        boolean isValid = factory.validateProduct(product);
        
        Map<String, Object> result = new HashMap<>();
        result.put("valid", isValid);
        result.put("industryType", industryType);
        result.put("productSku", product.getSku());
        
        return ResponseEntity.ok(result);
    }
}
