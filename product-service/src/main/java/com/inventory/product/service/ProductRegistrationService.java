package com.inventory.product.service;

import com.inventory.product.dto.InitialBatchDTO;
import com.inventory.product.dto.ProductRegistrationRequest;
import com.inventory.product.dto.ProductRegistrationResponse;
import com.inventory.product.model.PharmacyProduct;
import com.inventory.product.model.Product;
import com.inventory.product.repository.CategoryRepository;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductRegistrationService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final com.inventory.product.repository.PharmacyProductRepository pharmacyProductRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public ProductRegistrationResponse registerProductWithStock(ProductRegistrationRequest request) {
        // Step 1: Create and save Product entity
        Product product = new Product();
        product.setSku(request.getSku());
        product.setName(request.getName());
        product.setDescription(request.getDescription());

        // Handle null prices to prevent DataIntegrityViolationException
        product.setPrice(request.getPrice() != null ? request.getPrice() : java.math.BigDecimal.ZERO);

        java.math.BigDecimal purchasePrice = request.getInitialBatch() != null
                ? request.getInitialBatch().getPurchasePrice()
                : null;
        product.setCostPrice(purchasePrice != null ? purchasePrice : java.math.BigDecimal.ZERO);

        product.setCategory(request.getCategory());
        product.setBrand(request.getBrand());
        product.setUnit(request.getUnit());
        product.setReorderLevel(request.getReorderLevel());
        product.setOrgId(request.getOrgId());
        product.setIndustryType(request.getIndustryType());
        product.setIsActive(true);

        if (request.getInitialBatch() != null && request.getInitialBatch().getWarehouseId() != null) {
            product.setWarehouseId(request.getInitialBatch().getWarehouseId().toString());
        }

        // Handle industry-specific attributes (pharmacy: genericName,
        // isPrescriptionRequired)
        if (request.getIndustrySpecificAttributes() != null) {
            product.setIndustrySpecificAttributes(request.getIndustrySpecificAttributes());
        } else if ("PHARMACY".equalsIgnoreCase(request.getIndustryType())) {
            // Auto-populate pharmacy attributes if provided at root level
            Map<String, Object> pharmAttrs = new HashMap<>();
            if (request.getGenericName() != null) {
                pharmAttrs.put("genericName", request.getGenericName());
            }
            if (request.getIsPrescriptionRequired() != null) {
                pharmAttrs.put("isPrescriptionRequired", request.getIsPrescriptionRequired());
            }
            if (!pharmAttrs.isEmpty()) {
                product.setIndustrySpecificAttributes(pharmAttrs);
            }
        }

        Product savedProduct = productRepository.save(product);

        // Increment category count
        incrementCategoryCount(savedProduct.getCategory(), savedProduct.getOrgId());

        // Create Pharmacy specific record if industry is PHARMACY
        if ("PHARMACY".equalsIgnoreCase(request.getIndustryType())) {
            createPharmacyAttributeRecord(savedProduct, request);
        }

        // Step 2: Create initial stock/batch if provided
        Long stockId = null;
        if (request.getInitialBatch() != null && request.getInitialBatch().getQuantity() != null
                && request.getInitialBatch().getQuantity() > 0) {
            try {
                stockId = createInitialStock(savedProduct, request.getInitialBatch(), request.getOrgId());
            } catch (Exception e) {
                // This will cause the entire transaction to roll back
                throw new RuntimeException("Failed to create initial stock: " + e.getMessage(), e);
            }
        }

        return new ProductRegistrationResponse(
                savedProduct.getId(),
                savedProduct.getSku(),
                savedProduct.getName(),
                stockId,
                "Product registered successfully" + (stockId != null ? " with initial stock" : ""));
    }

    private Long createInitialStock(Product product, InitialBatchDTO batch, Long orgId) {
        // Call inventory-service to create stock
        Map<String, Object> stockRequest = new HashMap<>();
        stockRequest.put("productId", product.getId());
        stockRequest.put("warehouseId", batch.getWarehouseId());
        stockRequest.put("quantity", batch.getQuantity());
        stockRequest.put("availableQuantity", batch.getQuantity());
        stockRequest.put("reservedQuantity", 0);
        stockRequest.put("orgId", orgId);
        stockRequest.put("reorderLevel", product.getReorderLevel());

        try {
            Map response = restTemplate.postForObject(
                    "http://inventory-service/api/inventory/stocks",
                    stockRequest,
                    Map.class);

            if (response != null && response.get("id") != null) {
                return Long.valueOf(response.get("id").toString());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create stock in inventory-service: " + e.getMessage(), e);
        }

        return null;
    }

    private void createPharmacyAttributeRecord(Product product, ProductRegistrationRequest request) {
        if (request.getInitialBatch() == null || request.getInitialBatch().getExpiryDate() == null) {
            // Note: PharmacyProduct requires an expiryDate. If not provided, we skip
            // creating the batch record.
            // In a production system, we might want to log this or enforce it in the UI.
            return;
        }

        PharmacyProduct pharmacyProduct = new PharmacyProduct();
        pharmacyProduct.setProductId(product.getId());
        pharmacyProduct.setOrgId(product.getOrgId());

        // Map from InitialBatchDTO
        pharmacyProduct.setBatchNumber(
                request.getInitialBatch().getBatchNumber() != null ? request.getInitialBatch().getBatchNumber()
                        : "INITIAL-" + product.getSku());
        pharmacyProduct.setExpiryDate(request.getInitialBatch().getExpiryDate());
        pharmacyProduct.setBatchSize(request.getInitialBatch().getQuantity());

        // Map from Request root
        pharmacyProduct.setIsPrescriptionRequired(
                request.getIsPrescriptionRequired() != null ? request.getIsPrescriptionRequired() : false);
        pharmacyProduct
                .setRequiresRefrigeration(request.getIsRefrigerated() != null ? request.getIsRefrigerated() : false);
        pharmacyProduct.setActiveIngredient(request.getGenericName());

        // Default pharmacy attributes
        pharmacyProduct.setIsExpired(false);
        pharmacyProduct.setIsRecalled(false);

        pharmacyProductRepository.save(pharmacyProduct);
    }

    private void incrementCategoryCount(String categoryName, Long orgId) {
        if (categoryName == null || categoryName.trim().isEmpty() || orgId == null)
            return;

        String trimmedName = categoryName.trim();
        System.out.println(
                "DEBUG: (Registration) Incrementing category count for name: [" + trimmedName + "] Org: " + orgId);
        categoryRepository.findByNameIgnoreCaseAndOrgId(trimmedName, orgId).ifPresentOrElse(category -> {
            Integer currentCount = category.getCount();
            category.setCount((currentCount == null ? 0 : currentCount) + 1);
            categoryRepository.saveAndFlush(category);
            System.out.println("DEBUG: Category found and count updated to: " + category.getCount());
        }, () -> {
            System.out.println("DEBUG: Category NOT found for name: [" + trimmedName + "] Org: " + orgId);
        });
    }
}
