package com.inventory.catalog.repository;

import com.inventory.catalog.model.CatalogProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogProductRepository extends JpaRepository<CatalogProduct, Long> {
    Optional<CatalogProduct> findBySku(String sku);
    List<CatalogProduct> findByOrgId(Long orgId);
    List<CatalogProduct> findByIndustryType(String industryType);
    List<CatalogProduct> findByCategory(String category);
    List<CatalogProduct> findByBrand(String brand);
    List<CatalogProduct> findByIsActive(Boolean isActive);
    List<CatalogProduct> findByIsFeatured(Boolean isFeatured);
    List<CatalogProduct> findByOrgIdAndIndustryType(Long orgId, String industryType);
    
    @Query("SELECT p FROM CatalogProduct p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    List<CatalogProduct> searchByKeyword(@Param("keyword") String keyword);
}
