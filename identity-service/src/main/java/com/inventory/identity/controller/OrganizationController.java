package com.inventory.identity.controller;

import com.inventory.identity.model.Organization;
import com.inventory.identity.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Organization management
 * Handles organization data from identity_db.organizations table
 */
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Slf4j
public class OrganizationController {
    
    private final OrganizationService organizationService;
    
    /**
     * GET /api/organizations/{id}
     * Fetch organization by ID
     * 
     * @param id Organization ID
     * @return Organization details
     */
    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(@PathVariable Long id) {
        log.info("REST request to get Organization by id: {}", id);
        try {
            Organization organization = organizationService.findById(id);
            return ResponseEntity.ok(organization);
        } catch (RuntimeException e) {
            log.error("Organization not found with id: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/organizations/tenant/{tenantId}
     * Fetch organization by tenant ID
     * 
     * @param tenantId Tenant UUID
     * @return Organization details
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<Organization> getOrganizationByTenantId(@PathVariable String tenantId) {
        log.info("REST request to get Organization by tenantId: {}", tenantId);
        try {
            Organization organization = organizationService.findByTenantId(tenantId);
            return ResponseEntity.ok(organization);
        } catch (RuntimeException e) {
            log.error("Organization not found with tenantId: {}", tenantId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/organizations/name/{name}
     * Fetch organization by name
     * 
     * @param name Organization name
     * @return Organization details
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<Organization> getOrganizationByName(@PathVariable String name) {
        log.info("REST request to get Organization by name: {}", name);
        try {
            Organization organization = organizationService.findByName(name);
            return ResponseEntity.ok(organization);
        } catch (RuntimeException e) {
            log.error("Organization not found with name: {}", name, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/organizations
     * Fetch all organizations
     * 
     * @return List of all organizations
     */
    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        log.info("REST request to get all Organizations");
        List<Organization> organizations = organizationService.findAll();
        return ResponseEntity.ok(organizations);
    }
    
    /**
     * PUT /api/organizations/{id}
     * Update organization details
     * 
     * @param id Organization ID
     * @param organizationDetails Updated organization data
     * @return Updated organization
     */
    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(
            @PathVariable Long id,
            @RequestBody Organization organizationDetails) {
        log.info("REST request to update Organization : {}", id);
        try {
            Organization updatedOrganization = organizationService.update(id, organizationDetails);
            return ResponseEntity.ok(updatedOrganization);
        } catch (RuntimeException e) {
            log.error("Failed to update organization with id: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }
}
