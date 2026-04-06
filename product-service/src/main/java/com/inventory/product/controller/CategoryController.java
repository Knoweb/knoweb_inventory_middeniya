package com.inventory.product.controller;

import com.inventory.product.model.Category;
import com.inventory.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(categoryService.getAllCategories(orgId));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category,
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        return ResponseEntity.ok(categoryService.createCategory(category, orgId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.updateCategory(id, category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
