package com.inventory.product.service;

import com.inventory.product.model.Product;
import com.inventory.product.repository.CategoryRepository;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByOrg(Long orgId) {
        return productRepository.findByOrgId(orgId);
    }

    public List<Product> getProductsByOrgAndIndustry(Long orgId, String industryType) {
        return productRepository.findByOrgIdAndIndustryType(orgId, industryType);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> getActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    public List<Product> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public Product createProduct(Product product) {
        // Handle null prices to prevent DataIntegrityViolationException
        if (product.getPrice() == null) {
            product.setPrice(java.math.BigDecimal.ZERO);
        }
        if (product.getCostPrice() == null) {
            product.setCostPrice(java.math.BigDecimal.ZERO);
        }

        Product savedProduct = productRepository.save(product);
        incrementCategoryCount(savedProduct.getCategory(), savedProduct.getOrgId());
        return savedProduct;
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        String oldCategory = product.getCategory();
        Long orgId = product.getOrgId();

        // Primary fields
        product.setSku(productDetails.getSku());
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());

        // Selective updates to prevent data loss for fields not present in all forms
        if (productDetails.getPrice() != null) {
            product.setPrice(productDetails.getPrice());
        }

        if (productDetails.getCostPrice() != null) {
            product.setCostPrice(productDetails.getCostPrice());
        }

        if (productDetails.getCategory() != null) {
            product.setCategory(productDetails.getCategory());
        }

        if (productDetails.getBrand() != null) {
            product.setBrand(productDetails.getBrand());
        }

        if (productDetails.getUnit() != null) {
            product.setUnit(productDetails.getUnit());
        }

        if (productDetails.getReorderLevel() != null) {
            product.setReorderLevel(productDetails.getReorderLevel());
        }

        if (productDetails.getIsActive() != null) {
            product.setIsActive(productDetails.getIsActive());
        }

        // Preserve industry specific attributes if present in request
        if (productDetails.getIndustrySpecificAttributes() != null
                && !productDetails.getIndustrySpecificAttributes().isEmpty()) {
            product.setIndustrySpecificAttributes(productDetails.getIndustrySpecificAttributes());
        }

        Product updatedProduct = productRepository.save(product);

        // Handle category change
        if (oldCategory != null && !oldCategory.equals(updatedProduct.getCategory())) {
            decrementCategoryCount(oldCategory, orgId);
            incrementCategoryCount(updatedProduct.getCategory(), orgId);
        }

        return updatedProduct;
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        String category = product.getCategory();
        Long orgId = product.getOrgId();

        product.setIsActive(false);
        productRepository.save(product);

        decrementCategoryCount(category, orgId);
    }

    private void incrementCategoryCount(String categoryName, Long orgId) {
        if (categoryName == null || categoryName.trim().isEmpty() || orgId == null)
            return;

        String trimmedName = categoryName.trim();
        System.out.println("DEBUG: Incrementing category count for name: [" + trimmedName + "] Org: " + orgId);
        categoryRepository.findByNameIgnoreCaseAndOrgId(trimmedName, orgId).ifPresentOrElse(category -> {
            Integer currentCount = category.getCount();
            category.setCount((currentCount == null ? 0 : currentCount) + 1);
            categoryRepository.saveAndFlush(category);
            System.out.println("DEBUG: Category found and count updated to: " + category.getCount());
        }, () -> {
            System.out.println("DEBUG: Category NOT found for name: [" + trimmedName + "] Org: " + orgId);
        });
    }

    private void decrementCategoryCount(String categoryName, Long orgId) {
        if (categoryName == null || categoryName.trim().isEmpty() || orgId == null)
            return;

        String trimmedName = categoryName.trim();
        categoryRepository.findByNameIgnoreCaseAndOrgId(trimmedName, orgId).ifPresent(category -> {
            Integer currentCount = category.getCount();
            if (currentCount != null && currentCount > 0) {
                category.setCount(currentCount - 1);
                categoryRepository.saveAndFlush(category);
            }
        });
    }

    public String generateNextSku(Long orgId) {
        return productRepository.findTopByOrgIdOrderByIdDesc(orgId)
                .map(product -> {
                    String lastSku = product.getSku();
                    if (lastSku != null && lastSku.startsWith("PRD-")) {
                        try {
                            int lastNumber = Integer.parseInt(lastSku.substring(4));
                            return String.format("PRD-%04d", lastNumber + 1);
                        } catch (NumberFormatException e) {
                            return "PRD-0001";
                        }
                    }
                    return "PRD-0001";
                })
                .orElse("PRD-0001");
    }
}
