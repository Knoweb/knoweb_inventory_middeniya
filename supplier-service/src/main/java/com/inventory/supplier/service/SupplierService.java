package com.inventory.supplier.service;

import com.inventory.supplier.dto.SupplierRequestDto;
import com.inventory.supplier.model.Supplier;
import com.inventory.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public List<Supplier> getSuppliersByOrganization(Long orgId) {
        return supplierRepository.findByOrgId(orgId);
    }

    public Optional<Supplier> getSupplierById(Long id) {
        return supplierRepository.findById(id);
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, SupplierRequestDto dto) {
        return supplierRepository.findById(id)
                .map(existing -> {
                    if (dto.getName() != null) {
                        existing.setName(dto.getName());
                    }
                    if (dto.getContactInfo() != null) {
                        existing.setContactInfo(dto.getContactInfo());
                    }
                    if (dto.getOrgId() != null) {
                        existing.setOrgId(dto.getOrgId());
                    }
                    return supplierRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
    }

    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }
}
