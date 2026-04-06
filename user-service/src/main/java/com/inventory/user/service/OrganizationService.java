package com.inventory.user.service;

import com.inventory.user.model.Organization;
import com.inventory.user.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {
    
    private final OrganizationRepository organizationRepository;
    
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }
    
    public Optional<Organization> getOrganizationById(Long id) {
        return organizationRepository.findById(id);
    }
    
    public Organization createOrganization(Organization organization) {
        // Generate unique tenant ID
        if (organization.getTenantId() == null || organization.getTenantId().isEmpty()) {
            organization.setTenantId("TENANT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return organizationRepository.save(organization);
    }
    
    public Organization updateOrganization(Long id, Organization organizationDetails) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
        
        organization.setName(organizationDetails.getName());
        organization.setIndustryType(organizationDetails.getIndustryType());
        organization.setSubscriptionTier(organizationDetails.getSubscriptionTier());
        organization.setContactEmail(organizationDetails.getContactEmail());
        organization.setContactPhone(organizationDetails.getContactPhone());
        organization.setTaxId(organizationDetails.getTaxId());
        organization.setIsActive(organizationDetails.getIsActive());
        
        return organizationRepository.save(organization);
    }
    
    public void deleteOrganization(Long id) {
        Organization organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
        organization.setIsActive(false);
        organizationRepository.save(organization);
    }
}
