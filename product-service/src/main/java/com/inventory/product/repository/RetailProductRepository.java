package com.inventory.product.repository;

import com.inventory.product.model.RetailProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RetailProductRepository extends JpaRepository<RetailProduct, Long> {
    
    Optional<RetailProduct> findByProductId(Long productId);
    
    Optional<RetailProduct> findByVariantSku(String variantSku);
    
    List<RetailProduct> findByOrgId(Long orgId);
    
    // Variant Management
    List<RetailProduct> findByParentSku(String parentSku);
    
    List<RetailProduct> findByIsMasterProductTrue();
    
    List<RetailProduct> findByParentSkuAndColorName(String parentSku, String colorName);
    
    List<RetailProduct> findByParentSkuAndSizeValue(String parentSku, String sizeValue);
    
    // Size Variants
    List<RetailProduct> findBySizeCategory(String sizeCategory);
    
    List<RetailProduct> findBySizeValue(String sizeValue);
    
    // Color Variants
    List<RetailProduct> findByColorFamily(String colorFamily);
    
    List<RetailProduct> findByColorName(String colorName);
    
    // Seasonal Tracking
    List<RetailProduct> findBySeason(String season);
    
    List<RetailProduct> findBySeasonAndSeasonYear(String season, Integer year);
    
    List<RetailProduct> findByCollectionName(String collectionName);
    
    List<RetailProduct> findByIsSeasonalTrue();
    
    @Query("SELECT r FROM RetailProduct r WHERE r.endOfSeasonDate <= CURRENT_TIMESTAMP AND r.isClearance = true")
    List<RetailProduct> findClearanceItems();
    
    // Promotions
    List<RetailProduct> findByIsOnSaleTrue();
    
    List<RetailProduct> findByPromotionCode(String promotionCode);
    
    @Query("SELECT r FROM RetailProduct r WHERE r.isOnSale = true AND r.promotionEndDate >= CURRENT_TIMESTAMP")
    List<RetailProduct> findActivePromotions();
    
    // Display Features
    List<RetailProduct> findByIsFeaturedTrue();
    
    List<RetailProduct> findByIsNewArrivalTrue();
    
    List<RetailProduct> findByIsBestsellerTrue();
    
    List<RetailProduct> findByIsClearanceTrue();
    
    // Availability
    List<RetailProduct> findByIsAvailableOnlineTrue();
    
    List<RetailProduct> findByIsAvailableInStoreTrue();
    
    // Style and Material
    List<RetailProduct> findByMaterial(String material);
    
    List<RetailProduct> findByPattern(String pattern);
}
