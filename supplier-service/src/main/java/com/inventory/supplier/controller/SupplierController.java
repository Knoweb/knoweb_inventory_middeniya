package com.inventory.supplier.controller;

import com.inventory.supplier.dto.SupplierRequestDto;
import com.inventory.supplier.model.Supplier;
import com.inventory.supplier.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers(
            @RequestHeader(value = "X-Org-ID", required = false) Long orgId) {
        List<Supplier> suppliers = (orgId != null)
                ? supplierService.getSuppliersByOrganization(orgId)
                : supplierService.getAllSuppliers();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        return supplierService.getSupplierById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<Supplier>> getSuppliersByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(supplierService.getSuppliersByOrganization(orgId));
    }

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(supplier));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody SupplierRequestDto dto) {
        try {
            return ResponseEntity.ok(supplierService.updateSupplier(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
