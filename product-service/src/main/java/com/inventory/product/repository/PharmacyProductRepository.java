package com.inventory.product.repository;

import com.inventory.product.model.PharmacyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyProductRepository extends JpaRepository<PharmacyProduct, Long> {

    Optional<PharmacyProduct> findByProductId(Long productId);

    List<PharmacyProduct> findByBatchNumber(String batchNumber);

    List<PharmacyProduct> findByOrgId(Long orgId);

    // Expiry Management
    List<PharmacyProduct> findByOrgIdAndExpiryDateBefore(Long orgId, LocalDate date);

    List<PharmacyProduct> findByOrgIdAndExpiryDateBetween(Long orgId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT p FROM PharmacyProduct p WHERE p.orgId = :orgId AND p.expiryDate <= :date AND p.isExpired = false")
    List<PharmacyProduct> findExpiringProducts(@Param("orgId") Long orgId, @Param("date") LocalDate date);

    @Query("SELECT p FROM PharmacyProduct p WHERE p.orgId = :orgId AND p.daysUntilExpiry <= :days AND p.daysUntilExpiry > 0")
    List<PharmacyProduct> findProductsExpiringWithinDays(@Param("orgId") Long orgId, @Param("days") Integer days);

    List<PharmacyProduct> findByOrgIdAndIsExpiredTrue(Long orgId);

    // Prescription Management
    List<PharmacyProduct> findByOrgIdAndIsPrescriptionRequired(Long orgId, Boolean required);

    List<PharmacyProduct> findByOrgIdAndPrescriptionType(Long orgId, String type);

    List<PharmacyProduct> findByOrgIdAndControlledSubstanceSchedule(Long orgId, String schedule);

    // Drug Information
    List<PharmacyProduct> findByOrgIdAndActiveIngredient(Long orgId, String ingredient);

    List<PharmacyProduct> findByOrgIdAndDrugClass(Long orgId, String drugClass);

    // Recall Management
    List<PharmacyProduct> findByIsRecalledTrue();

    List<PharmacyProduct> findByOrgIdAndIsRecalledTrue(Long orgId);

    // Storage Conditions
    List<PharmacyProduct> findByOrgIdAndRequiresRefrigerationTrue(Long orgId);

    // Stats counting
    long countByOrgIdAndIsExpiredFalseAndDaysUntilExpiryBetween(Long orgId, int start, int end);

    long countByOrgIdAndIsExpiredTrue(Long orgId);

    long countByOrgIdAndIsPrescriptionRequiredTrue(Long orgId);

    long countByOrgIdAndRequiresRefrigerationTrue(Long orgId);
}
