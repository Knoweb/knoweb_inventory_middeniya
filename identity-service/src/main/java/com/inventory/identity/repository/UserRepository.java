package com.inventory.identity.repository;

import com.inventory.identity.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find user by email with roles eagerly loaded
     * CRITICAL: Use JOIN FETCH to ensure roles are loaded in same query
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);
    
    /**
     * Legacy method - may not load roles properly
     * Consider using findByEmailWithRoles() instead
     */
    Optional<User> findByEmail(String email);
    
    Boolean existsByEmail(String email);
    List<User> findByOrgId(Long orgId);
    List<User> findByBranchId(Long branchId);
    List<User> findByIsActive(Boolean isActive);
}
