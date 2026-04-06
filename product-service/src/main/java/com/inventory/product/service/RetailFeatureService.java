package com.inventory.product.service;

import com.inventory.product.model.RetailProduct;
import com.inventory.product.repository.RetailProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for Retail-specific features
 * Handles size/color variants and seasonal tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RetailFeatureService {
    
    private final RetailProductRepository retailProductRepository;
    
    /**
     * Create retail product attributes
     */
    public RetailProduct createRetailProduct(RetailProduct retailProduct) {
        log.info("Creating retail product for productId: {}", retailProduct.getProductId());
        return retailProductRepository.save(retailProduct);
    }
    
    /**
     * Update retail product attributes
     */
    public RetailProduct updateRetailProduct(Long id, RetailProduct retailProduct) {
        RetailProduct existing = retailProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retail product not found with id: " + id));
        
        // Update all fields
        existing.setParentSku(retailProduct.getParentSku());
        existing.setVariantSku(retailProduct.getVariantSku());
        existing.setSizeCategory(retailProduct.getSizeCategory());
        existing.setSizeValue(retailProduct.getSizeValue());
        existing.setSizeNumeric(retailProduct.getSizeNumeric());
        existing.setColorName(retailProduct.getColorName());
        existing.setColorCode(retailProduct.getColorCode());
        existing.setColorFamily(retailProduct.getColorFamily());
        existing.setColorImages(retailProduct.getColorImages());
        existing.setStyleName(retailProduct.getStyleName());
        existing.setPattern(retailProduct.getPattern());
        existing.setMaterial(retailProduct.getMaterial());
        existing.setSeason(retailProduct.getSeason());
        existing.setSeasonYear(retailProduct.getSeasonYear());
        existing.setCollectionName(retailProduct.getCollectionName());
        existing.setIsSeasonal(retailProduct.getIsSeasonal());
        existing.setMsrp(retailProduct.getMsrp());
        existing.setSalePrice(retailProduct.getSalePrice());
        existing.setIsOnSale(retailProduct.getIsOnSale());
        existing.setDiscountPercentage(retailProduct.getDiscountPercentage());
        existing.setCustomAttributes(retailProduct.getCustomAttributes());
        
        return retailProductRepository.save(existing);
    }
    
    /**
     * Get retail product by product ID
     */
    public Optional<RetailProduct> getByProductId(Long productId) {
        return retailProductRepository.findByProductId(productId);
    }
    
    /**
     * Get all variants for a parent SKU
     */
    public List<RetailProduct> getVariantsByParentSku(String parentSku) {
        return retailProductRepository.findByParentSku(parentSku);
    }
    
    /**
     * Get specific variant by color and size
     */
    public Optional<RetailProduct> getVariant(String parentSku, String colorName, String sizeValue) {
        List<RetailProduct> colorVariants = retailProductRepository.findByParentSkuAndColorName(parentSku, colorName);
        return colorVariants.stream()
            .filter(v -> sizeValue.equals(v.getSizeValue()))
            .findFirst();
    }
    
    /**
     * Get products by season
     */
    public List<RetailProduct> getProductsBySeason(String season, Integer year) {
        if (year != null) {
            return retailProductRepository.findBySeasonAndSeasonYear(season, year);
        }
        return retailProductRepository.findBySeason(season);
    }
    
    /**
     * Get products by collection
     */
    public List<RetailProduct> getProductsByCollection(String collectionName) {
        return retailProductRepository.findByCollectionName(collectionName);
    }
    
    /**
     * Get clearance items
     */
    public List<RetailProduct> getClearanceItems() {
        return retailProductRepository.findClearanceItems();
    }
    
    /**
     * Get products on sale
     */
    public List<RetailProduct> getProductsOnSale() {
        return retailProductRepository.findByIsOnSaleTrue();
    }
    
    /**
     * Get active promotions
     */
    public List<RetailProduct> getActivePromotions() {
        return retailProductRepository.findActivePromotions();
    }
    
    /**
     * Apply sale pricing
     */
    public RetailProduct applySale(Long id, BigDecimal salePrice, BigDecimal discountPercentage) {
        RetailProduct product = retailProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retail product not found"));
        
        product.setSalePrice(salePrice);
        product.setDiscountPercentage(discountPercentage);
        product.setIsOnSale(true);
        
        log.info("Applied sale to retail product: id={}, salePrice={}, discount={}%", 
            id, salePrice, discountPercentage);
        
        return retailProductRepository.save(product);
    }
    
    /**
     * Apply promotion
     */
    public RetailProduct applyPromotion(Long id, String promotionCode, 
                                       LocalDateTime startDate, LocalDateTime endDate) {
        RetailProduct product = retailProductRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retail product not found"));
        
        product.setPromotionCode(promotionCode);
        product.setPromotionStartDate(startDate);
        product.setPromotionEndDate(endDate);
        product.setIsOnSale(true);
        
        return retailProductRepository.save(product);
    }
    
    /**
     * Mark as clearance
     */
    public void markAsClearance(String season, Integer year) {
        List<RetailProduct> products = retailProductRepository.findBySeasonAndSeasonYear(season, year);
        
        for (RetailProduct product : products) {
            product.setIsClearance(true);
            product.setIsOnSale(true);
            retailProductRepository.save(product);
        }
        
        log.info("Marked {} products as clearance for season {} {}", products.size(), season, year);
    }
    
    /**
     * Get featured products
     */
    public List<RetailProduct> getFeaturedProducts() {
        return retailProductRepository.findByIsFeaturedTrue();
    }
    
    /**
     * Get new arrivals
     */
    public List<RetailProduct> getNewArrivals() {
        return retailProductRepository.findByIsNewArrivalTrue();
    }
    
    /**
     * Get bestsellers
     */
    public List<RetailProduct> getBestsellers() {
        return retailProductRepository.findByIsBestsellerTrue();
    }
    
    /**
     * Get products by color family
     */
    public List<RetailProduct> getByColorFamily(String colorFamily) {
        return retailProductRepository.findByColorFamily(colorFamily);
    }
    
    /**
     * Get products by material
     */
    public List<RetailProduct> getByMaterial(String material) {
        return retailProductRepository.findByMaterial(material);
    }
    
    /**
     * Get available sizes for a parent SKU
     */
    public List<String> getAvailableSizes(String parentSku) {
        return retailProductRepository.findByParentSku(parentSku).stream()
            .map(RetailProduct::getSizeValue)
            .distinct()
            .toList();
    }
    
    /**
     * Get available colors for a parent SKU
     */
    public List<String> getAvailableColors(String parentSku) {
        return retailProductRepository.findByParentSku(parentSku).stream()
            .map(RetailProduct::getColorName)
            .distinct()
            .toList();
    }
    
    /**
     * Get all retail products for organization
     */
    public List<RetailProduct> getByOrganization(Long orgId) {
        return retailProductRepository.findByOrgId(orgId);
    }
    
    /**
     * Delete retail product
     */
    public void deleteRetailProduct(Long id) {
        retailProductRepository.deleteById(id);
    }
}
