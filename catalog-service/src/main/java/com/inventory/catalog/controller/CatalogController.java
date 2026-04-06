package com.inventory.catalog.controller;

import com.inventory.catalog.model.CatalogProduct;
import com.inventory.catalog.service.CatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    
    @Autowired
    private CatalogService catalogService;
    
    @PostMapping("/products")
    public ResponseEntity<CatalogProduct> createProduct(@RequestBody CatalogProduct product) {
        return ResponseEntity.ok(catalogService.createProduct(product));
    }
    
    @GetMapping("/products")
    public ResponseEntity<List<CatalogProduct>> getAllProducts() {
        return ResponseEntity.ok(catalogService.getAllProducts());
    }
    
    @GetMapping("/products/{id}")
    public ResponseEntity<CatalogProduct> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductById(id));
    }
    
    @GetMapping("/products/sku/{sku}")
    public ResponseEntity<CatalogProduct> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(catalogService.getProductBySku(sku));
    }
    
    @GetMapping("/products/organization/{orgId}")
    public ResponseEntity<List<CatalogProduct>> getProductsByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(catalogService.getProductsByOrganization(orgId));
    }
    
    @GetMapping("/products/industry/{industryType}")
    public ResponseEntity<List<CatalogProduct>> getProductsByIndustry(@PathVariable String industryType) {
        return ResponseEntity.ok(catalogService.getProductsByIndustry(industryType));
    }
    
    @GetMapping("/products/category/{category}")
    public ResponseEntity<List<CatalogProduct>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(catalogService.getProductsByCategory(category));
    }
    
    @GetMapping("/products/search")
    public ResponseEntity<List<CatalogProduct>> searchProducts(@RequestParam String keyword) {
        return ResponseEntity.ok(catalogService.searchProducts(keyword));
    }
    
    @GetMapping("/products/featured")
    public ResponseEntity<List<CatalogProduct>> getFeaturedProducts() {
        return ResponseEntity.ok(catalogService.getFeaturedProducts());
    }
    
    @PutMapping("/products/{id}")
    public ResponseEntity<CatalogProduct> updateProduct(@PathVariable Long id, 
                                                         @RequestBody CatalogProduct product) {
        return ResponseEntity.ok(catalogService.updateProduct(id, product));
    }
    
    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        catalogService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
