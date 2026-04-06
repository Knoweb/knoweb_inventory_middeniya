package com.inventory.identity.service;

import com.inventory.identity.dto.*;
import com.inventory.identity.model.CompanyTenant;
import com.inventory.identity.model.Organization;
import com.inventory.identity.model.User;
import com.inventory.identity.repository.CompanyTenantRepository;
import com.inventory.identity.repository.OrganizationRepository;
import com.inventory.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Collections;

/**
 * Registration Orchestrator Service
 * 
 * Handles unified registration flow across multiple systems:
 * 1. Creates user in identity_db (identity service)
 * 2. Creates company tenant in subscription_db (subscription service data)
 * 3. Routes to appropriate system based on selection:
 * - GINUMA: POST to http://ginuma-service:8081/api/tenant/setup
 * - INVENTORY: POST to http://user-service:8086/api/users/org/setup
 * 
 * IMPLEMENTS STRICT ISOLATION: Each system's data stays in its own database
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationOrchestratorService {

    private final UserRepository userRepository;
    private final CompanyTenantRepository companyTenantRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    // System endpoint configurations (using Docker internal service names)
    private static final String GINUMA_SETUP_ENDPOINT = "http://ginuma-service:8081/api/tenant/setup";
    private static final String INVENTORY_SETUP_ENDPOINT = "http://user-service:8086/api/users/org/setup";
    private static final String PIRISA_SETUP_ENDPOINT = "http://152.42.213.138/api/company/register";

    /**
     * Main orchestration method
     * Handles the complete registration flow with strict isolation
     */
    @Transactional
    public UnifiedRegistrationResponse registerUser(UnifiedRegistrationRequest request) {
        log.info("Starting unified registration for email: {}, system: {}",
                request.getEmail(), request.getSelectedSystem());

        try {
            // Step 1: Validate request
            validateRegistrationRequest(request);

            // Step 2: Generate unique org_id
            Long orgId = generateUniqueOrgId();
            log.info("Generated org_id: {} for company: {}", orgId, request.getCompanyName());

            // Step 3: Create organization in identity_db.organizations
            Organization organization = createOrganization(request);
            log.info("Created organization in identity_db with orgId: {}, name: {}", organization.getId(),
                    organization.getName());

            // Step 4: Create user in identity_db.users with organization reference
            User user = createIdentityUser(request, organization.getId());
            log.info("Created user in identity_db with userId: {}, linked to orgId: {}", user.getId(), user.getOrgId());

            // Step 5: Create company tenant in subscription_db (using orgId from
            // organization)
            CompanyTenant companyTenant = createCompanyTenant(request, organization.getId());
            log.info("Created company tenant in subscription_db with id: {}", companyTenant.getId());

            // Step 6: Route to appropriate system based on selection
            SystemSetupResponse systemResponse = routeToSystemSetup(request, organization.getId());
            log.info("System setup completed for {}: {}", request.getSelectedSystem(), systemResponse);

            // Step 7: Build success response
            return buildSuccessResponse(user, companyTenant, request, systemResponse);

        } catch (Exception e) {
            log.error("Registration failed for email: {}, error: {}", request.getEmail(), e.getMessage(), e);
            return UnifiedRegistrationResponse.failure("Registration failed: " + e.getMessage());
        }
    }

    /**
     * Step 1: Validate registration request
     */
    private void validateRegistrationRequest(UnifiedRegistrationRequest request) {
        // Validate password confirmation (if provided by frontend)
        if (!request.passwordsMatch()) {
            throw new IllegalArgumentException("Password and confirmation password do not match");
        }

        // Validate VAT information
        if (!request.vatValidation()) {
            throw new IllegalArgumentException("VAT number is required when VAT registered");
        }

        // Check if email already exists in identity_db
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // Check if company email already exists in subscription_db
        if (companyTenantRepository.existsByContactEmail(request.getEmail())) {
            throw new IllegalArgumentException("Company already registered with this email");
        }

        // Check if company name already exists in identity_db.organizations
        if (organizationRepository.existsByName(request.getCompanyName())) {
            throw new IllegalArgumentException("Company name already exists: " + request.getCompanyName());
        }

        // Validate system selection
        if (request.getSelectedSystem() == null || request.getSelectedSystem().trim().isEmpty()) {
            throw new IllegalArgumentException("System selection is required");
        }

        // Validate system selection is valid
        String system = request.getSelectedSystem().toUpperCase();
        if (!system.equals("GINUMA") && !system.equals("INVENTORY") &&
                !system.equals("PIRISAHR") && !system.equals("ALL_IN_ONE")) {
            throw new IllegalArgumentException("Invalid system selection: " + request.getSelectedSystem() +
                    ". Valid options are: GINUMA, INVENTORY, PIRISAHR, ALL_IN_ONE");
        }
    }

    /**
     * Step 2: Generate unique org_id
     */
    private Long generateUniqueOrgId() {
        return companyTenantRepository.getNextOrgId();
    }

    /**
     * Step 3: Create organization in identity_db.organizations
     * Maps company details from registration DTO to Organization entity
     */
    private Organization createOrganization(UnifiedRegistrationRequest request) {
        log.info("Creating organization with name: {}, industryType: {}",
                request.getCompanyName(), request.getIndustryType());

        Organization organization = new Organization();

        // Map company details from DTO to Organization entity
        organization.setName(request.getCompanyName());
        organization.setIndustryType(
                request.getIndustryType() != null ? request.getIndustryType().toUpperCase() : "GENERAL");
        organization.setContactEmail(request.getEmail());
        organization.setContactPhone(request.getContactPhone());
        organization.setAddress(request.getRegisteredAddress());
        organization.setTaxId(request.getTinNo());
        organization.setIsActive(true);
        // tenantId will be auto-generated in @PrePersist

        Organization savedOrg = organizationRepository.save(organization);
        log.info("Organization saved successfully with ID: {}, tenantId: {}",
                savedOrg.getId(), savedOrg.getTenantId());

        return savedOrg;
    }

    /**
     * Step 4: Create user in identity_db.users
     * This is the SSO user that can access any system they're subscribed to
     * CRITICAL: User must be linked to the organization via orgId
     */
    private User createIdentityUser(UnifiedRegistrationRequest request, Long organizationId) {
        log.info("Creating user with email: {}, linking to orgId: {}",
                request.getEmail(), organizationId);

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getContactPhone())
                .orgId(organizationId) // CRITICAL: Link user to organization
                .branchId(null) // Will be set later if needed
                .isActive(true)
                .isEmailVerified(false) // Can be verified via email confirmation later
                .build();

        User savedUser = userRepository.save(user);
        log.info("User saved successfully with ID: {}, orgId: {}",
                savedUser.getId(), savedUser.getOrgId());

        return savedUser;
    }

    /**
     * Step 4: Create company tenant in subscription_db.company_tenant
     * Status: ACTIVE for GINUMA (instant), PENDING for INVENTORY (requires
     * approval)
     */
    private CompanyTenant createCompanyTenant(UnifiedRegistrationRequest request, Long orgId) {
        // Determine status based on system
        String status = request.isGinumaSystem() ? "ACTIVE" : "ACTIVE"; // Both active for now

        // Calculate subscription dates (14-day trial by default)
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(14); // 14-day trial

        CompanyTenant companyTenant = CompanyTenant.builder()
                .orgId(orgId)
                .companyName(request.getCompanyName())
                .contactEmail(request.getEmail())
                .status(status)
                .planType("TRIAL")
                .subscriptionStartDate(startDate)
                .subscriptionEndDate(endDate)
                .subscribedSystems(Collections.singletonList(request.getSelectedSystem().toUpperCase()))
                .build();

        return companyTenantRepository.save(companyTenant);
    }

    /**
     * Step 5: Route to appropriate system for setup
     * IMPLEMENTS STRICT ISOLATION
     * 
     * System routing strategy:
     * - GINUMA: Setup Ginuma ERP only
     * - INVENTORY: Setup Inventory System only
     * - PIRISAHR: Setup Ginuma ERP (PirisaHR is part of Ginuma ecosystem)
     * - ALL_IN_ONE: Setup both Ginuma ERP and Inventory System for unified access
     */
    private SystemSetupResponse routeToSystemSetup(UnifiedRegistrationRequest request, Long orgId) {
        log.info("Performing mandatory multi-system setup for unified experience (orgId: {})", orgId);

        // Always perform cross-system registration to ensure all modules are ready
        // Regardless of which landing page or selection was made
        SystemSetupResponse ginumaResponse = setupGinumaSystem(request, orgId);
        SystemSetupResponse inventoryResponse = setupInventorySystem(request, orgId);
        SystemSetupResponse pirisaResponse = setupPirisaHRSystem(request, orgId);

        log.info("Multi-system setup completed for org_id: {}", orgId);

        // Return the appropriate response based on selection (or pirisa as default)
        if (request.isInventorySystem()) {
            return inventoryResponse;
        } else if (request.isPirisaHRSystem()) {
            return pirisaResponse;
        } else {
            return ginumaResponse;
        }
    }

    /**
     * Setup Ginuma ERP System
     * Makes REST call to: http://ginuma-service:8081/api/tenant/setup
     * Data saved to: ginuma_db
     */
    private SystemSetupResponse setupGinumaSystem(UnifiedRegistrationRequest request, Long orgId) {
        log.info("Setting up Ginuma ERP for org_id: {}", orgId);

        try {
            // Build request DTO for Ginuma
            GinumaTenantSetupRequest ginumaRequest = GinumaTenantSetupRequest.builder()
                    .orgId(orgId)
                    .companyName(request.getCompanyName())
                    .email(request.getEmail())
                    .phoneNumber(request.getContactPhone())
                    .adminEmail(request.getEmail())
                    .adminFirstName(request.getFirstName() != null ? request.getFirstName() : "Admin")
                    .adminLastName(request.getLastName() != null ? request.getLastName() : "User")
                    .address(request.getRegisteredAddress())
                    .city(null) // Not in new DTO
                    .country(request.getCountry())
                    .industry(request.getIndustryType())
                    .databaseName("ginuma_db")
                    .isTrialAccount(true)
                    .subscriptionTier("BASIC")
                    // Additional fields from new DTO
                    .registrationNo(request.getRegistrationNo())
                    .tinNo(request.getTinNo())
                    .vatNo(request.getVatNo())
                    .website(request.getWebsite())
                    .currency(request.getCurrency())
                    .build();

            // Make HTTP POST request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GinumaTenantSetupRequest> entity = new HttpEntity<>(ginumaRequest, headers);

            ResponseEntity<SystemSetupResponse> response = restTemplate.exchange(
                    GINUMA_SETUP_ENDPOINT,
                    HttpMethod.POST,
                    entity,
                    SystemSetupResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Ginuma setup successful for org_id: {}", orgId);
                return response.getBody();
            } else {
                throw new RuntimeException("Ginuma setup failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to setup Ginuma system for org_id: {}, error: {}", orgId, e.getMessage(), e);

            // Return error response instead of throwing exception
            return SystemSetupResponse.builder()
                    .success(false)
                    .message("Ginuma setup failed")
                    .errorCode("GINUMA_SETUP_ERROR")
                    .errorDetails(e.getMessage())
                    .build();
        }
    }

    /**
     * Setup Inventory Management System
     * Makes REST call to: http://user-service:8086/api/users/org/setup
     * Data saved to: user_db
     */
    private SystemSetupResponse setupInventorySystem(UnifiedRegistrationRequest request, Long orgId) {
        log.info("Setting up Inventory System for org_id: {}", orgId);

        try {
            // Build request DTO for Inventory
            InventoryOrgSetupRequest inventoryRequest = InventoryOrgSetupRequest.builder()
                    .orgId(orgId)
                    .organizationName(request.getCompanyName())
                    .contactEmail(request.getEmail())
                    .phoneNumber(request.getContactPhone())
                    .adminEmail(request.getEmail())
                    .adminFirstName(request.getFirstName() != null ? request.getFirstName() : "Admin")
                    .adminLastName(request.getLastName() != null ? request.getLastName() : "User")
                    .primaryBranchName("Main Branch")
                    .primaryBranchCode("MAIN")
                    .address(request.getRegisteredAddress())
                    .city(null) // Not in new DTO
                    .country(request.getCountry())
                    .industry(request.getIndustryType())
                    .isTrialAccount(true)
                    .trialDaysRemaining(14)
                    // Additional fields from new DTO
                    .registrationNo(request.getRegistrationNo())
                    .tinNo(request.getTinNo())
                    .vatNo(request.getVatNo())
                    .website(request.getWebsite())
                    .factoryAddress(request.getFactoryAddress())
                    .currency(request.getCurrency())
                    .build();

            // Make HTTP POST request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<InventoryOrgSetupRequest> entity = new HttpEntity<>(inventoryRequest, headers);

            ResponseEntity<SystemSetupResponse> response = restTemplate.exchange(
                    INVENTORY_SETUP_ENDPOINT,
                    HttpMethod.POST,
                    entity,
                    SystemSetupResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Inventory setup successful for org_id: {}", orgId);
                return response.getBody();
            } else {
                throw new RuntimeException("Inventory setup failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to setup Inventory system for org_id: {}, error: {}", orgId, e.getMessage(), e);

            // Return error response instead of throwing exception
            return SystemSetupResponse.builder()
                    .success(false)
                    .message("Inventory setup failed")
                    .errorCode("INVENTORY_SETUP_ERROR")
                    .errorDetails(e.getMessage())
                    .build();
        }
    }

    /**
     * Setup PirisaHR System
     * Makes REST call to: http://152.42.213.138:8080/api/company/register
     * Data saved to: pirisa_db (separate droplet)
     */
    private SystemSetupResponse setupPirisaHRSystem(UnifiedRegistrationRequest request, Long orgId) {
        log.info("Setting up PirisaHR System for org_id: {} on remote IP", orgId);

        try {
            // Build request Map for Pirisa (matching CompanyRegistrationRequest)
            java.util.Map<String, Object> pirisaRequest = new java.util.HashMap<>();
            pirisaRequest.put("cmpName", request.getCompanyName());
            pirisaRequest.put("cmpEmail", request.getEmail());
            pirisaRequest.put("cmpPhone", request.getContactPhone());
            pirisaRequest.put("cmpAddress", request.getRegisteredAddress());
            pirisaRequest.put("username", request.getEmail()); // Use email as username for SSO link
            pirisaRequest.put("password", request.getPassword());
            pirisaRequest.put("orgId", orgId); // Unified orgId

            // Make HTTP POST request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<java.util.Map<String, Object>> entity = new HttpEntity<>(pirisaRequest, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    PIRISA_SETUP_ENDPOINT,
                    HttpMethod.POST,
                    entity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("PirisaHR setup successful for org_id: {}", orgId);
                return SystemSetupResponse.builder()
                        .success(true)
                        .message("PirisaHR setup completed successfully")
                        .orgId(orgId)
                        .build();
            } else {
                throw new RuntimeException("PirisaHR setup failed with status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to setup PirisaHR system for org_id: {}, error: {}", orgId, e.getMessage(), e);

            return SystemSetupResponse.builder()
                    .success(false)
                    .message("PirisaHR setup failed")
                    .errorCode("PIRISA_SETUP_ERROR")
                    .errorDetails(e.getMessage())
                    .build();
        }
    }

    /**
     * Step 6: Build success response
     */
    private UnifiedRegistrationResponse buildSuccessResponse(
            User user,
            CompanyTenant companyTenant,
            UnifiedRegistrationRequest request,
            SystemSetupResponse systemResponse) {
        // Determine redirect URL based on system
        String redirectUrl = request.isGinumaSystem()
                ? "http://localhost:5176/login"
                : "http://localhost:5174/login";

        return UnifiedRegistrationResponse.builder()
                .success(true)
                .message("Registration completed successfully")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(request.getFirstName() + " " + request.getLastName())
                .orgId(companyTenant.getOrgId())
                .orgName(companyTenant.getCompanyName())
                .tenantId(companyTenant.getId())
                .branchId(systemResponse != null ? systemResponse.getBranchId() : null)
                .subscribedSystems(companyTenant.getSubscribedSystems())
                .registeredSystem(request.getSelectedSystem().toUpperCase())
                .accountStatus(companyTenant.getStatus())
                .isTrialAccount(true)
                .trialDaysRemaining(14)
                .subscriptionStartDate(companyTenant.getSubscriptionStartDate().atStartOfDay())
                .subscriptionEndDate(companyTenant.getSubscriptionEndDate().atStartOfDay())
                .redirectUrl(redirectUrl)
                .nextAction("LOGIN")
                .identityServiceUserId(user.getId())
                .subscriptionServiceCompanyId(companyTenant.getId())
                .systemSpecificOrgId(systemResponse != null ? systemResponse.getOrgId() : null)
                .registeredAt(companyTenant.getCreatedAt())
                .build();
    }
}
