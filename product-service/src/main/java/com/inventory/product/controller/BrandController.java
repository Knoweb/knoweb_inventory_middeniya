package com.inventory.product.controller;

import com.inventory.product.model.Brand;
import com.inventory.product.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {
    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<List<Brand>> getAllBrands(@RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(brandService.getAllBrands(orgId));
    }

    @PostMapping
    public ResponseEntity<Brand> createBrand(@RequestBody Brand brand,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(brandService.createBrand(brand, orgId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Brand> updateBrand(@PathVariable Long id, @RequestBody Brand brand) {
        return ResponseEntity.ok(brandService.updateBrand(id, brand));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }
}
