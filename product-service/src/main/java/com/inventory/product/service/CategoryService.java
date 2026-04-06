package com.inventory.product.service;

import com.inventory.product.model.Category;
import com.inventory.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories(Long orgId) {
        if (orgId == null)
            return categoryRepository.findAll();
        return categoryRepository.findByOrgId(orgId);
    }

    public Category createCategory(Category category, Long orgId) {
        category.setOrgId(orgId);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category details) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setName(details.getName());
        category.setDescription(details.getDescription());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
