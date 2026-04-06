package com.inventory.product.controller;

import com.inventory.product.dto.ProductRegistrationRequest;
import com.inventory.product.dto.ProductRegistrationResponse;
import com.inventory.product.model.Product;
import com.inventory.product.service.ProductService;
import com.inventory.product.service.ProductRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductRegistrationService productRegistrationService;

    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Product>> getProductsByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(productService.getProductsByOrg(orgId));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId,
            @RequestHeader(value = "X-Industry-Type", required = false) String industryType) {
        if (orgId != null && industryType != null) {
            return ResponseEntity.ok(productService.getProductsByOrgAndIndustry(orgId, industryType));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<Product> getProductBySku(@PathVariable String sku) {
        return productService.getProductBySku(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/next-sku/{orgId}")
    public ResponseEntity<String> getNextSku(@PathVariable Long orgId) {
        return ResponseEntity.ok(productService.generateNextSku(orgId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Product>> getActiveProducts() {
        return ResponseEntity.ok(productService.getActiveProducts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String name) {
        return ResponseEntity.ok(productService.searchProducts(name));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        if (orgId != null) {
            product.setOrgId(orgId);
        }
        Product createdProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    @PostMapping("/with-stock")
    public ResponseEntity<ProductRegistrationResponse> registerProductWithStock(
            @RequestBody ProductRegistrationRequest request,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        if (orgId != null) {
            request.setOrgId(orgId);
        }
        ProductRegistrationResponse response = productRegistrationService.registerProductWithStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        if (orgId != null) {
            product.setOrgId(orgId);
        }
        Product updatedProduct = productService.updateProduct(id, product);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
