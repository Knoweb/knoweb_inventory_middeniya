package com.inventory.product.service;

import com.inventory.product.dto.PharmacyStatsDTO;
import com.inventory.product.model.PharmacyProduct;
import com.inventory.product.model.Product;
import com.inventory.product.repository.PharmacyProductRepository;
import com.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for Pharmacy-specific features
 * Handles batch tracking, expiry dates, and prescription management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PharmacyFeatureService {

    private final PharmacyProductRepository pharmacyProductRepository;
    private final ProductRepository productRepository;

    /**
     * Create pharmacy product attributes
     */
    public PharmacyProduct createPharmacyProduct(PharmacyProduct pharmacyProduct) {
        log.info("Creating pharmacy product for productId: {}", pharmacyProduct.getProductId());
        return pharmacyProductRepository.save(pharmacyProduct);
    }

    /**
     * Update pharmacy product attributes
     */
    public PharmacyProduct updatePharmacyProduct(Long id, PharmacyProduct pharmacyProduct) {
        PharmacyProduct existing = pharmacyProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pharmacy product not found with id: " + id));

        // Update fields
        existing.setBatchNumber(pharmacyProduct.getBatchNumber());
        existing.setBatchSize(pharmacyProduct.getBatchSize());
        existing.setManufacturingDate(pharmacyProduct.getManufacturingDate());
        existing.setExpiryDate(pharmacyProduct.getExpiryDate());
        existing.setShelfLifeDays(pharmacyProduct.getShelfLifeDays());
        existing.setStorageConditions(pharmacyProduct.getStorageConditions());
        existing.setIsPrescriptionRequired(pharmacyProduct.getIsPrescriptionRequired());
        existing.setPrescriptionType(pharmacyProduct.getPrescriptionType());
        existing.setControlledSubstanceSchedule(pharmacyProduct.getControlledSubstanceSchedule());
        existing.setActiveIngredient(pharmacyProduct.getActiveIngredient());
        existing.setStrength(pharmacyProduct.getStrength());
        existing.setDosageForm(pharmacyProduct.getDosageForm());
        existing.setNdcCode(pharmacyProduct.getNdcCode());
        existing.setDrugClass(pharmacyProduct.getDrugClass());
        existing.setRequiresRefrigeration(pharmacyProduct.getRequiresRefrigeration());
        existing.setTemperatureMin(pharmacyProduct.getTemperatureMin());
        existing.setTemperatureMax(pharmacyProduct.getTemperatureMax());
        existing.setWarningLabels(pharmacyProduct.getWarningLabels());
        existing.setSideEffects(pharmacyProduct.getSideEffects());
        existing.setInteractions(pharmacyProduct.getInteractions());

        return pharmacyProductRepository.save(existing);
    }

    /**
     * Get pharmacy product by product ID
     */
    public Optional<PharmacyProduct> getByProductId(Long productId) {
        return pharmacyProductRepository.findByProductId(productId);
    }

    /**
     * Get products by batch number
     */
    public List<PharmacyProduct> getByBatchNumber(String batchNumber) {
        return pharmacyProductRepository.findByBatchNumber(batchNumber);
    }

    /**
     * Get products expiring within specified days
     */
    public List<PharmacyProduct> getProductsExpiringWithinDays(Long orgId, Integer days) {
        return pharmacyProductRepository.findProductsExpiringWithinDays(orgId, days);
    }

    /**
     * Get products expiring between dates
     */
    public List<PharmacyProduct> getProductsExpiringBetween(Long orgId, LocalDate startDate, LocalDate endDate) {
        return pharmacyProductRepository.findByOrgIdAndExpiryDateBetween(orgId, startDate, endDate);
    }

    /**
     * Get expired products
     */
    public List<PharmacyProduct> getExpiredProducts(Long orgId) {
        return pharmacyProductRepository.findByOrgIdAndIsExpiredTrue(orgId);
    }

    /**
     * Get prescription products
     */
    public List<PharmacyProduct> getPrescriptionProducts(Long orgId, Boolean required) {
        return pharmacyProductRepository.findByOrgIdAndIsPrescriptionRequired(orgId, required);
    }

    /**
     * Get controlled substances
     */
    public List<PharmacyProduct> getControlledSubstances(Long orgId, String schedule) {
        return pharmacyProductRepository.findByOrgIdAndControlledSubstanceSchedule(orgId, schedule);
    }

    /**
     * Get products by active ingredient
     */
    public List<PharmacyProduct> getByActiveIngredient(Long orgId, String ingredient) {
        return pharmacyProductRepository.findByOrgIdAndActiveIngredient(orgId, ingredient);
    }

    /**
     * Get products requiring refrigeration
     */
    public List<PharmacyProduct> getRefrigeratedProducts(Long orgId) {
        return pharmacyProductRepository.findByOrgIdAndRequiresRefrigerationTrue(orgId);
    }

    /**
     * Get recalled products
     */
    public List<PharmacyProduct> getRecalledProducts(Long orgId) {
        if (orgId != null) {
            return pharmacyProductRepository.findByOrgIdAndIsRecalledTrue(orgId);
        }
        return pharmacyProductRepository.findByIsRecalledTrue();
    }

    /**
     * Mark product as recalled
     */
    public PharmacyProduct recallProduct(Long id, String reason) {
        PharmacyProduct product = pharmacyProductRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pharmacy product not found"));

        product.setIsRecalled(true);
        product.setRecallDate(LocalDate.now());
        product.setRecallReason(reason);

        log.warn("Product recalled: productId={}, batch={}, reason={}",
                product.getProductId(), product.getBatchNumber(), reason);

        return pharmacyProductRepository.save(product);
    }

    /**
     * Check and update expiry status for all products
     */
    public void updateExpiryStatuses(Long orgId) {
        List<PharmacyProduct> productsToUpdate = (orgId != null) ? pharmacyProductRepository.findByOrgId(orgId)
                : pharmacyProductRepository.findAll();

        LocalDate today = LocalDate.now();
        int updatedCount = 0;
        for (PharmacyProduct product : productsToUpdate) {
            if (product.getExpiryDate() != null) {
                boolean wasExpired = product.getIsExpired();
                boolean isNowExpired = product.getExpiryDate().isBefore(today);

                if (wasExpired != isNowExpired) {
                    product.setIsExpired(isNowExpired);
                    pharmacyProductRepository.save(product);
                    updatedCount++;
                }
            }
        }

        log.info("Updated expiry status for {} products", updatedCount);
    }

    /**
     * Get all pharmacy products for organization
     */
    public List<PharmacyProduct> getByOrganization(Long orgId) {
        return pharmacyProductRepository.findByOrgId(orgId);
    }

    /**
     * Delete pharmacy product
     */
    public void deletePharmacyProduct(Long id) {
        pharmacyProductRepository.deleteById(id);
    }

    /**
     * Get summary stats for organization
     */
    public PharmacyStatsDTO getPharmacyStats(Long orgId) {
        long expiringSoon = pharmacyProductRepository.countByOrgIdAndIsExpiredFalseAndDaysUntilExpiryBetween(orgId, 0,
                30);
        long expired = pharmacyProductRepository.countByOrgIdAndIsExpiredTrue(orgId);
        long prescriptionOnly = pharmacyProductRepository.countByOrgIdAndIsPrescriptionRequiredTrue(orgId);
        long refrigerated = pharmacyProductRepository.countByOrgIdAndRequiresRefrigerationTrue(orgId);

        return new PharmacyStatsDTO(expiringSoon, expired, prescriptionOnly, refrigerated);
    }

    /**
     * Sync legacy products to pharmacy table
     */
    public void syncPharmacyData(Long orgId) {
        List<Product> products = productRepository.findByOrgIdAndIndustryType(orgId, "PHARMACY");
        for (Product p : products) {
            if (pharmacyProductRepository.findByProductId(p.getId()).isEmpty()) {
                PharmacyProduct pp = new PharmacyProduct();
                pp.setProductId(p.getId());
                pp.setOrgId(orgId);
                pp.setBatchNumber("SYNC-" + p.getSku());
                // Placeholder expiry: +1 year
                pp.setExpiryDate(LocalDate.now().plusYears(1));

                Map<String, Object> attrs = p.getIndustrySpecificAttributes();
                if (attrs != null) {
                    pp.setIsPrescriptionRequired(Boolean.TRUE.equals(attrs.get("isPrescriptionRequired")));
                    pp.setRequiresRefrigeration(Boolean.TRUE.equals(attrs.get("isRefrigerated")));
                    pp.setActiveIngredient((String) attrs.get("genericName"));
                }
                pharmacyProductRepository.save(pp);
            }
        }
    }
}
