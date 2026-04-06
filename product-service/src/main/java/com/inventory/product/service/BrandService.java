package com.inventory.product.service;

import com.inventory.product.model.Brand;
import com.inventory.product.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BrandService {
    private final BrandRepository brandRepository;

    public List<Brand> getAllBrands(Long orgId) {
        if (orgId == null)
            return brandRepository.findAll();
        return brandRepository.findByOrgId(orgId);
    }

    public Brand createBrand(Brand brand, Long orgId) {
        brand.setOrgId(orgId);
        return brandRepository.save(brand);
    }

    public Brand updateBrand(Long id, Brand details) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        brand.setName(details.getName());
        brand.setManufacturer(details.getManufacturer());
        return brandRepository.save(brand);
    }

    public void deleteBrand(Long id) {
        brandRepository.deleteById(id);
    }
}
