package com.inventory.identity.service;

import com.inventory.identity.dto.*;
import com.inventory.identity.exception.SubscriptionExpiredException;
import com.inventory.identity.exception.SubscriptionRegistrationException;
import com.inventory.identity.exception.UnauthorizedException;
import com.inventory.identity.model.*;
import com.inventory.identity.repository.*;
import com.inventory.identity.security.JwtTokenProvider;
import com.inventory.identity.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private RestTemplate restTemplate;

    @Transactional
    public JwtResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Update last login
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // ===== SUBSCRIPTION CHECK =====
        // Check subscription status before generating JWT
        List<String> allowedSystems = null;
        if (user.getOrgId() != null) {
            try {
                String subscriptionUrl = "http://subscription-service/api/internal/subscriptions/access/" + user.getOrgId();
                ResponseEntity<SubscriptionAccessResponse> subscriptionResponse = restTemplate.getForEntity(
                        subscriptionUrl,
                        SubscriptionAccessResponse.class);
                
                if (subscriptionResponse.getBody() != null) {
                    SubscriptionAccessResponse subscriptionData = subscriptionResponse.getBody();
                    
                    // Check if company is blocked
                    if (subscriptionData.isBlocked()) {
                        throw new UnauthorizedException("Company account is blocked by the administrator.");
                    }
                    
                    // Check if subscription expired (no allowed systems)
                    allowedSystems = subscriptionData.getAllowedSystems();
                    if (allowedSystems == null || allowedSystems.isEmpty()) {
                        throw new SubscriptionExpiredException("Subscription expired. Please make a payment.");
                    }
                }
            } catch (UnauthorizedException | SubscriptionExpiredException e) {
                throw e; // Re-throw these specific exceptions
            } catch (Exception e) {
                System.err.println("Warning: Failed to check subscription status for orgId " + user.getOrgId() + ": " + e.getMessage());
                // Continue with login but without allowedSystems - this is a fallback for backwards compatibility
            }
        }

        // Fetch organization details from local identity_db.organizations table
        String tenantId = null;
        String orgName = null;
        String logo = null;
        String industryType = null;
        
        if (user.getOrgId() != null) {
            try {
                Organization organization = organizationRepository.findById(user.getOrgId()).orElse(null);
                if (organization != null) {
                    tenantId = organization.getTenantId();
                    orgName = organization.getName();
                    industryType = organization.getIndustryType();
                    // Note: companyLogo is stored in user-service, fetch separately if needed
                }
            } catch (Exception e) {
                System.err.println("Warning: Failed to fetch organization details for orgId " + user.getOrgId() + ": " + e.getMessage());
            }
        }

        String jwt = tokenProvider.generateToken(authentication, userDetails.getId(),
                userDetails.getOrgId(), tenantId, userDetails.getBranchId(), industryType, allowedSystems);
        String refreshToken = tokenProvider.generateRefreshToken(userDetails.getEmail());

        // Save refresh token
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshTokenRepository.save(refreshTokenEntity);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // industryType already fetched above from organization repository

        return new JwtResponse(jwt, refreshToken, userDetails.getId(),
                userDetails.getEmail(), userDetails.getEmail(),
                userDetails.getOrgId(), tenantId, orgName, userDetails.getBranchId(), industryType, logo, roles);
    }

    @Transactional
    public JwtResponse register(SignupRequest signupRequest) {
        // Validate email
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Step 1: Create Organization via user-service
        Map<String, Object> organizationRequest = new HashMap<>();
        organizationRequest.put("name", signupRequest.getCompanyName());
        organizationRequest.put("industryType", signupRequest.getIndustryType().toUpperCase());
        organizationRequest.put("tenantId", "TENANT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        organizationRequest.put("contactEmail",
                signupRequest.getContactEmail() != null ? signupRequest.getContactEmail() : signupRequest.getEmail());
        organizationRequest.put("contactPhone",
                signupRequest.getContactPhone() != null ? signupRequest.getContactPhone()
                        : signupRequest.getPhoneNumber());
        organizationRequest.put("mobileNumber", signupRequest.getMobileNumber());
        organizationRequest.put("website", signupRequest.getWebsite());
        organizationRequest.put("registeredAddress", signupRequest.getRegisteredAddress());
        organizationRequest.put("factoryAddress", signupRequest.getFactoryAddress());
        organizationRequest.put("country", signupRequest.getCountry());
        organizationRequest.put("currency", signupRequest.getCurrency());
        organizationRequest.put("registrationNo", signupRequest.getRegistrationNo());
        organizationRequest.put("tinNo", signupRequest.getTinNo());
        organizationRequest.put("isVatRegistered", signupRequest.isVatRegistered());
        organizationRequest.put("vatNo", signupRequest.getVatNo());
        organizationRequest.put("logoUrl", signupRequest.getCompanyLogo());
        organizationRequest.put("subscriptionTier", "STARTER");
        organizationRequest.put("isActive", true);

        Long orgId = null;
        try {
            ResponseEntity<Map> orgResponse = restTemplate.postForEntity(
                    "http://user-service/api/organizations",
                    organizationRequest,
                    Map.class);

            if (orgResponse.getBody() != null && orgResponse.getBody().get("id") != null) {
                orgId = Long.valueOf(orgResponse.getBody().get("id").toString());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("Failed to create organization. Status: " + e.getStatusCode());
            System.err.println("Response body: " + e.getResponseBodyAsString());
            throw new RuntimeException("Error: Failed to create organization. " + e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error: Failed to create organization. " + e.getMessage());
        }

        if (orgId == null) {
            throw new RuntimeException("Error: Failed to get organization ID!");
        }

        // ===== STEP 1.5: Register with Subscription Service (12-month trial) =====
        try {
            String contactEmail = signupRequest.getContactEmail() != null 
                    ? signupRequest.getContactEmail() 
                    : signupRequest.getEmail();
            
            SubscriptionRegisterRequest subscriptionRequest = SubscriptionRegisterRequest.builder()
                    .orgId(orgId)
                    .companyName(signupRequest.getCompanyName())
                    .contactEmail(contactEmail)
                    .build();
            
            System.out.println("📝 Registering organization " + orgId + " with subscription-service (12-month trial)...");
            
            ResponseEntity<Map> subscriptionResponse = restTemplate.postForEntity(
                    "http://subscription-service/api/internal/subscriptions/register",
                    subscriptionRequest,
                    Map.class);
            
            if (subscriptionResponse.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Successfully registered with subscription-service: orgId=" + orgId);
                if (subscriptionResponse.getBody() != null) {
                    System.out.println("   Trial Status: 12-month trial activated for GINUMA and INVENTORY");
                    System.out.println("   Company Status: ACTIVE");
                }
            } else {
                System.err.println("⚠️ Subscription service returned non-success status: " + subscriptionResponse.getStatusCode());
                throw new SubscriptionRegistrationException(
                        "Failed to register with subscription service. Status: " + subscriptionResponse.getStatusCode(),
                        orgId);
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("❌ HTTP Error registering with subscription-service:");
            System.err.println("   Status: " + e.getStatusCode());
            System.err.println("   Response: " + e.getResponseBodyAsString());
            System.err.println("   OrgId: " + orgId);
            
            // This is a CRITICAL error - rollback registration
            throw new SubscriptionRegistrationException(
                    "Failed to register with subscription service: " + e.getMessage() + 
                    ". Status: " + e.getStatusCode() + ". Response: " + e.getResponseBodyAsString(),
                    orgId,
                    e);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            System.err.println("❌ Subscription-service is unreachable or down:");
            System.err.println("   Error: " + e.getMessage());
            System.err.println("   OrgId: " + orgId);
            
            // Service is down - this is CRITICAL, rollback registration
            throw new SubscriptionRegistrationException(
                    "Subscription service is currently unavailable. Please try again later. OrgId: " + orgId,
                    orgId,
                    e);
        } catch (SubscriptionRegistrationException e) {
            // Re-throw our custom exception
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Unexpected error registering with subscription-service:");
            System.err.println("   Error: " + e.getMessage());
            System.err.println("   OrgId: " + orgId);
            e.printStackTrace();
            
            // Unknown error - this is CRITICAL, rollback registration
            throw new SubscriptionRegistrationException(
                    "Unexpected error during subscription registration: " + e.getMessage(),
                    orgId,
                    e);
        }

        // Step 2: Create User (owner) and link to organization
        String rawPassword = signupRequest.getPassword();
        User user = new User();
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setPhoneNumber(signupRequest.getPhoneNumber());
        // industryType is now stored in Organization, not User
        user.setOrgId(orgId);
        user.setIsActive(true);

        Role ownerRole = roleRepository.findByName(RoleName.ROLE_ORG_ADMIN)
                .orElseThrow(() -> new RuntimeException("Error: OWNER role is not found."));

        Set<Role> roles = new HashSet<>();
        roles.add(ownerRole);
        user.setRoles(roles);

        userRepository.save(user);

        // Step 3: Sync organization to Ginuma-service
        try {
            Map<String, Object> syncRequest = new HashMap<>();
            syncRequest.put("orgId", orgId);
            syncRequest.put("orgName", signupRequest.getCompanyName());
            syncRequest.put("email", signupRequest.getContactEmail() != null ? signupRequest.getContactEmail() : signupRequest.getEmail());
            syncRequest.put("industryType", signupRequest.getIndustryType());
            syncRequest.put("contactPhone", signupRequest.getContactPhone());
            syncRequest.put("mobileNumber", signupRequest.getMobileNumber());
            syncRequest.put("registeredAddress", signupRequest.getRegisteredAddress());
            syncRequest.put("factoryAddress", signupRequest.getFactoryAddress());
            syncRequest.put("registrationNo", signupRequest.getRegistrationNo());
            syncRequest.put("vatNo", signupRequest.getVatNo());
            syncRequest.put("tinNo", signupRequest.getTinNo());
            syncRequest.put("isVatRegistered", signupRequest.isVatRegistered());
            syncRequest.put("logoUrl", signupRequest.getCompanyLogo());

            System.out.println("📤 Attempting to sync organization " + orgId + " to Ginuma-service...");
            
            ResponseEntity<Map> syncResponse = restTemplate.postForEntity(
                    "http://ginuma-service/api/superadmin/companies/sync",
                    syncRequest,
                    Map.class);

            if (syncResponse.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Successfully synced organization to Ginuma: " + orgId);
                if (syncResponse.getBody() != null) {
                    System.out.println("   Company ID in Ginuma: " + syncResponse.getBody().get("companyId"));
                }
            } else {
                System.err.println("⚠️ Ginuma sync returned non-success status: " + syncResponse.getStatusCode());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("❌ HTTP Error syncing to Ginuma-service:");
            System.err.println("   Status: " + e.getStatusCode());
            System.err.println("   Response: " + e.getResponseBodyAsString());
            System.err.println("   OrgId: " + orgId);
            e.printStackTrace();
            // Don't fail registration if Ginuma sync fails
        } catch (Exception e) {
            System.err.println("❌ Unexpected error syncing to Ginuma-service:");
            System.err.println("   Error: " + e.getMessage());
            System.err.println("   OrgId: " + orgId);
            e.printStackTrace();
            // Don't fail registration if Ginuma sync fails
        }

        // Step 4: Perform automatic login to return JwtResponse
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(user.getEmail());
        loginRequest.setPassword(rawPassword);

        return this.login(loginRequest);
    }

    @Transactional
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (!tokenProvider.validateToken(requestRefreshToken)) {
            throw new RuntimeException("Refresh token is invalid or expired!");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found!"));

        if (refreshToken.getIsRevoked() || refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token is expired or revoked!");
        }

        User user = refreshToken.getUser();
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        // ===== SUBSCRIPTION CHECK =====
        // Check subscription status when refreshing token (status may have changed)
        List<String> allowedSystems = null;
        if (user.getOrgId() != null) {
            try {
                String subscriptionUrl = "http://subscription-service/api/internal/subscriptions/access/" + user.getOrgId();
                ResponseEntity<SubscriptionAccessResponse> subscriptionResponse = restTemplate.getForEntity(
                        subscriptionUrl,
                        SubscriptionAccessResponse.class);
                
                if (subscriptionResponse.getBody() != null) {
                    SubscriptionAccessResponse subscriptionData = subscriptionResponse.getBody();
                    
                    // Check if company is blocked
                    if (subscriptionData.isBlocked()) {
                        throw new UnauthorizedException("Company account is blocked by the administrator.");
                    }
                    
                    // Check if subscription expired (no allowed systems)
                    allowedSystems = subscriptionData.getAllowedSystems();
                    if (allowedSystems == null || allowedSystems.isEmpty()) {
                        throw new SubscriptionExpiredException("Subscription expired. Please make a payment.");
                    }
                }
            } catch (UnauthorizedException | SubscriptionExpiredException e) {
                throw e; // Re-throw these specific exceptions
            } catch (Exception e) {
                System.err.println("Warning: Failed to check subscription status during token refresh for orgId " + user.getOrgId() + ": " + e.getMessage());
                // Continue with token refresh but without allowedSystems - backwards compatibility
            }
        }

        // Fetch organization details from local identity_db.organizations table
        String tenantId = null;
        String orgName = null;
        String logo = null;
        String industryType = null;
        
        if (user.getOrgId() != null) {
            try {
                Organization organization = organizationRepository.findById(user.getOrgId()).orElse(null);
                if (organization != null) {
                    tenantId = organization.getTenantId();
                    orgName = organization.getName();
                    industryType = organization.getIndustryType();
                    // Note: companyLogo stored in user-service
                }
            } catch (Exception e) {
                System.err.println("Warning: Failed to fetch organization details for orgId " + user.getOrgId() + ": " + e.getMessage());
            }
        }

        String newJwt = tokenProvider.generateToken(authentication, user.getId(),
                user.getOrgId(), tenantId, user.getBranchId(), industryType, allowedSystems);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // industryType already fetched above from organization repository

        return new JwtResponse(newJwt, requestRefreshToken, user.getId(),
                user.getEmail(), user.getEmail(),
                user.getOrgId(), tenantId, orgName, user.getBranchId(), industryType, logo, roles);
    }

    @Transactional
    public void logout(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        refreshTokenRepository.deleteByUser(user);
    }
}
