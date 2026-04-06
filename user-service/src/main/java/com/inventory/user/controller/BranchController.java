package com.inventory.user.controller;

import com.inventory.user.model.Branch;
import com.inventory.user.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        if (orgId != null) {
            return ResponseEntity.ok(branchService.getBranchesByOrganization(orgId));
        }
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        return branchService.getBranchById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Branch>> getBranchesByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(branchService.getBranchesByOrganization(orgId));
    }

    @GetMapping("/organization/{orgId}/active")
    public ResponseEntity<List<Branch>> getActiveBranchesByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(branchService.getActiveBranchesByOrganization(orgId));
    }

    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        Branch created = branchService.createBranch(branch);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(
            @PathVariable Long id,
            @RequestBody Branch branch) {
        Branch updated = branchService.updateBranch(id, branch);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }
}
