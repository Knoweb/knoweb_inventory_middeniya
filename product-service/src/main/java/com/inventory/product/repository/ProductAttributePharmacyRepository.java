package com.inventory.product.repository;

import com.inventory.product.model.ProductAttributePharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductAttributePharmacyRepository extends JpaRepository<ProductAttributePharmacy, Long> {
    List<ProductAttributePharmacy> findByProductId(Long productId);
}
