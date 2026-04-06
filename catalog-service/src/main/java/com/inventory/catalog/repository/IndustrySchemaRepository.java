package com.inventory.catalog.repository;

import com.inventory.catalog.model.IndustrySchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IndustrySchemaRepository extends JpaRepository<IndustrySchema, Long> {
    Optional<IndustrySchema> findByIndustryType(String industryType);
    List<IndustrySchema> findByIsActive(Boolean isActive);
    Boolean existsByIndustryType(String industryType);
}
