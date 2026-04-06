package com.inventory.identity.repository;

import com.inventory.identity.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByName(String name);
    Optional<Organization> findByTenantId(String tenantId);
    Boolean existsByName(String name);
}
