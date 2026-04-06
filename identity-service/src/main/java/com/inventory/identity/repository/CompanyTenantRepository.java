package com.inventory.identity.repository;

import com.inventory.identity.model.CompanyTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for CompanyTenant entity
 * Access to subscription_db.company_tenant table
 */
@Repository
public interface CompanyTenantRepository extends JpaRepository<CompanyTenant, Long> {
    
    /**
     * Find company by org_id
     */
    Optional<CompanyTenant> findByOrgId(Long orgId);
    
    /**
     * Find company by contact email
     */
    Optional<CompanyTenant> findByContactEmail(String contactEmail);
    
    /**
     * Check if company exists by org_id
     */
    boolean existsByOrgId(Long orgId);
    
    /**
     * Check if email already registered
     */
    boolean existsByContactEmail(String email);
    
    /**
     * Find companies subscribed to a specific system
     * Uses MySQL JSON_CONTAINS function
     */
    @Query(value = "SELECT * FROM company_tenant WHERE JSON_CONTAINS(subscribed_systems, :system)", 
           nativeQuery = true)
    Optional<CompanyTenant> findBySubscribedSystem(@Param("system") String system);
    
    /**
     * Get next available org_id
     */
    @Query("SELECT COALESCE(MAX(c.orgId), 0) + 1 FROM CompanyTenant c")
    Long getNextOrgId();
}
