package com.inventory.product.repository;

import com.inventory.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);

    List<Product> findByCategory(String category);

    List<Product> findByOrgId(Long orgId);

    List<Product> findByOrgIdAndIndustryType(Long orgId, String industryType);

    List<Product> findByIsActiveTrue();

    List<Product> findByNameContainingIgnoreCase(String name);

    Optional<Product> findTopByOrgIdOrderByIdDesc(Long orgId);

    Optional<Product> findTopByOrderByIdDesc();
}
