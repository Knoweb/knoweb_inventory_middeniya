package com.inventory.warehouse.controller;

import com.inventory.warehouse.dto.BranchDto;
import com.inventory.warehouse.dto.WarehouseResponseDto;
import com.inventory.warehouse.model.Warehouse;
import com.inventory.warehouse.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    // ── GET /api/warehouses ────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<WarehouseResponseDto>> getAllWarehouses(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<WarehouseResponseDto> result = (orgId != null)
                ? warehouseService.getWarehousesByOrg(orgId)
                : warehouseService.getAllWarehouses();
        return ResponseEntity.ok(result);
    }

    // ── GET /api/warehouses/{id} ───────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponseDto> getWarehouseById(@PathVariable Long id) {
        return warehouseService.getWarehouseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET /api/warehouses/organization/{orgId} ───────────────────────────────
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<WarehouseResponseDto>> getWarehousesByOrganization(
            @PathVariable Long orgId) {
        return ResponseEntity.ok(warehouseService.getWarehousesByOrg(orgId));
    }

    // ── GET /api/warehouses/branch/{branchId} ─────────────────────────────────
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<WarehouseResponseDto>> getWarehousesByBranch(
            @PathVariable Long branchId) {
        return ResponseEntity.ok(warehouseService.getWarehousesByBranch(branchId));
    }

    /**
     * GET /api/warehouses/branches?orgId={orgId}
     *
     * Proxies the user-service to return the list of branches for a given org.
     * Used by the frontend to populate the "Branch" dropdown when creating a
     * warehouse.
     */
    @GetMapping("/branches")
    public ResponseEntity<List<BranchDto>> getBranchesForOrg(
            @RequestParam Long orgId) {
        return ResponseEntity.ok(warehouseService.getBranchesByOrgId(orgId));
    }

    // ── POST /api/warehouses ───────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<WarehouseResponseDto> createWarehouse(
            @RequestBody Warehouse warehouse) {
        WarehouseResponseDto created = warehouseService.createWarehouse(warehouse);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── PUT /api/warehouses/{id} ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<WarehouseResponseDto> updateWarehouse(
            @PathVariable Long id,
            @RequestBody Warehouse warehouse) {
        return warehouseService.updateWarehouse(id, warehouse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE /api/warehouses/{id} ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable Long id) {
        boolean deactivated = warehouseService.deactivateWarehouse(id);
        return deactivated
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
