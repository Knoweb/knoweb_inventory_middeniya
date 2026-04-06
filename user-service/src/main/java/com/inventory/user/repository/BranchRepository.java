package com.inventory.user.repository;

import com.inventory.user.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByOrgId(Long orgId);

    List<Branch> findByOrgIdAndIsActiveTrue(Long orgId);
}
