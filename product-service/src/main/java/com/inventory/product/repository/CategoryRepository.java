package com.inventory.product.repository;

import com.inventory.product.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByOrgId(Long orgId);

    boolean existsByNameAndOrgId(String name, Long orgId);

    java.util.Optional<Category> findByNameIgnoreCaseAndOrgId(String name, Long orgId);
}
