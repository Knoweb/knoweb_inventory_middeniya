package com.inventory.user.service;

import com.inventory.user.model.Branch;
import com.inventory.user.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> getBranchesByOrganization(Long orgId) {
        return branchRepository.findByOrgId(orgId);
    }

    public List<Branch> getActiveBranchesByOrganization(Long orgId) {
        return branchRepository.findByOrgIdAndIsActiveTrue(orgId);
    }

    public Optional<Branch> getBranchById(Long id) {
        return branchRepository.findById(id);
    }

    public Branch createBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch branchDetails) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));

        branch.setLocationName(branchDetails.getLocationName());
        branch.setAddress(branchDetails.getAddress());
        branch.setTimezone(branchDetails.getTimezone());
        branch.setIsActive(branchDetails.getIsActive());

        return branchRepository.save(branch);
    }

    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        branch.setIsActive(false);
        branchRepository.save(branch);
    }
}
