package com.inventory.identity.service;

import com.inventory.identity.model.Organization;
import com.inventory.identity.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrganizationService {
    
    private final OrganizationRepository organizationRepository;
    
    /**
     * Find organization by ID
     */
    @Transactional(readOnly = true)
    public Organization findById(Long id) {
        log.debug("Finding organization with id: {}", id);
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
    }
    
    /**
     * Find organization by tenant ID
     */
    @Transactional(readOnly = true)
    public Organization findByTenantId(String tenantId) {
        log.debug("Finding organization with tenantId: {}", tenantId);
        return organizationRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found with tenantId: " + tenantId));
    }
    
    /**
     * Find organization by name
     */
    @Transactional(readOnly = true)
    public Organization findByName(String name) {
        log.debug("Finding organization with name: {}", name);
        return organizationRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Organization not found with name: " + name));
    }
    
    /**
     * Get all organizations
     */
    @Transactional(readOnly = true)
    public List<Organization> findAll() {
        log.debug("Finding all organizations");
        return organizationRepository.findAll();
    }
    
    /**
     * Update organization
     */
    public Organization update(Long id, Organization organizationDetails) {
        log.debug("Updating organization with id: {}", id);
        Organization organization = findById(id);
        
        if (organizationDetails.getName() != null) {
            organization.setName(organizationDetails.getName());
        }
        if (organizationDetails.getIndustryType() != null) {
            organization.setIndustryType(organizationDetails.getIndustryType());
        }
        if (organizationDetails.getContactEmail() != null) {
            organization.setContactEmail(organizationDetails.getContactEmail());
        }
        if (organizationDetails.getContactPhone() != null) {
            organization.setContactPhone(organizationDetails.getContactPhone());
        }
        if (organizationDetails.getAddress() != null) {
            organization.setAddress(organizationDetails.getAddress());
        }
        if (organizationDetails.getTaxId() != null) {
            organization.setTaxId(organizationDetails.getTaxId());
        }
        if (organizationDetails.getIsActive() != null) {
            organization.setIsActive(organizationDetails.getIsActive());
        }
        
        return organizationRepository.save(organization);
    }
}
