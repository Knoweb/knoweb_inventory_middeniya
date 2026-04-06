package com.inventory.catalog.service;

import com.inventory.catalog.model.CatalogProduct;
import com.inventory.catalog.model.IndustrySchema;
import com.inventory.catalog.repository.CatalogProductRepository;
import com.networknt.schema.ValidationMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class CatalogService {
    
    @Autowired
    private CatalogProductRepository productRepository;
    
    @Autowired
    private IndustrySchemaService schemaService;
    
    @Autowired
    private SchemaValidationService validationService;
    
    public CatalogProduct createProduct(CatalogProduct product) {
        // Validate attributes against industry schema
        if (product.getAttributes() != null && !product.getAttributes().isEmpty()) {
            IndustrySchema schema = schemaService.getSchemaByIndustryType(product.getIndustryType());
            Set<ValidationMessage> errors = validationService.getValidationErrors(
                    schema.getJsonSchema(), product.getAttributes());
            
            if (!errors.isEmpty()) {
                StringBuilder errorMsg = new StringBuilder("Schema validation failed: ");
                errors.forEach(error -> errorMsg.append(error.getMessage()).append("; "));
                throw new RuntimeException(errorMsg.toString());
            }
        }
        
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }
    
    public CatalogProduct getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }
    
    public CatalogProduct getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .orElseThrow(() -> new RuntimeException("Product not found with sku: " + sku));
    }
    
    public List<CatalogProduct> getAllProducts() {
        return productRepository.findAll();
    }
    
    public List<CatalogProduct> getProductsByOrganization(Long orgId) {
        return productRepository.findByOrgId(orgId);
    }
    
    public List<CatalogProduct> getProductsByIndustry(String industryType) {
        return productRepository.findByIndustryType(industryType);
    }
    
    public List<CatalogProduct> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }
    
    public List<CatalogProduct> searchProducts(String keyword) {
        return productRepository.searchByKeyword(keyword);
    }
    
    public List<CatalogProduct> getFeaturedProducts() {
        return productRepository.findByIsFeatured(true);
    }
    
    public CatalogProduct updateProduct(Long id, CatalogProduct updatedProduct) {
        CatalogProduct existing = getProductById(id);
        
        // Validate attributes if changed
        if (updatedProduct.getAttributes() != null) {
            IndustrySchema schema = schemaService.getSchemaByIndustryType(updatedProduct.getIndustryType());
            Set<ValidationMessage> errors = validationService.getValidationErrors(
                    schema.getJsonSchema(), updatedProduct.getAttributes());
            
            if (!errors.isEmpty()) {
                throw new RuntimeException("Schema validation failed");
            }
        }
        
        existing.setName(updatedProduct.getName());
        existing.setDescription(updatedProduct.getDescription());
        existing.setPrice(updatedProduct.getPrice());
        existing.setCategory(updatedProduct.getCategory());
        existing.setBrand(updatedProduct.getBrand());
        existing.setAttributes(updatedProduct.getAttributes());
        existing.setImages(updatedProduct.getImages());
        existing.setTags(updatedProduct.getTags());
        existing.setIsActive(updatedProduct.getIsActive());
        existing.setIsFeatured(updatedProduct.getIsFeatured());
        existing.setUpdatedAt(LocalDateTime.now());
        
        return productRepository.save(existing);
    }
    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
