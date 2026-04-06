package com.inventory.identity.controller;

import com.inventory.identity.dto.UnifiedRegistrationRequest;
import com.inventory.identity.dto.UnifiedRegistrationResponse;
import com.inventory.identity.service.RegistrationOrchestratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Registration Orchestrator Controller
 * 
 * Provides unified registration endpoint that handles:
 * 1. User registration in identity_db
 * 2. Company tenant creation in subscription_db
 * 3. System-specific setup (Ginuma or Inventory)
 * 
 * Endpoint: POST /api/auth/register/unified
 * 
 * Note: CORS is handled by API Gateway - do NOT add @CrossOrigin here
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RegistrationOrchestratorController {
    
    private final RegistrationOrchestratorService registrationOrchestratorService;
    
    /**
     * Unified Registration Endpoint
     * 
     * POST /api/auth/register/unified
     * 
     * Request Body: UnifiedRegistrationRequest
     * - companyName
     * - email
     * - password
     * - firstName, lastName
     * - selectedSystem: GINUMA or INVENTORY
     * - optional: address, city, country, industry, etc.
     * 
     * Response: UnifiedRegistrationResponse
     * - success: boolean
     * - message: string
     * - userId, orgId, tenantId
     * - subscribedSystems: ["GINUMA"] or ["INVENTORY"]
     * - redirectUrl: URL to login page of selected system
     * 
     * Example Request:
     * {
     *   "companyName": "Acme Corporation",
     *   "email": "admin@acme.com",
     *   "password": "SecurePass123",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "selectedSystem": "GINUMA",
     *   "phoneNumber": "+1234567890",
     *   "address": "123 Main St",
     *   "city": "New York",
     *   "country": "USA",
     *   "industry": "Technology"
     * }
     */
    @PostMapping("/register/unified")
    public ResponseEntity<UnifiedRegistrationResponse> registerUnified(
            @Valid @RequestBody UnifiedRegistrationRequest request
    ) {
        log.info("Received unified registration request for email: {}, system: {}", 
                 request.getEmail(), request.getSelectedSystem());
        
        try {
            // Execute orchestration
            UnifiedRegistrationResponse response = registrationOrchestratorService.registerUser(request);
            
            // Return appropriate HTTP status
            if (response.isSuccess()) {
                log.info("Registration successful for email: {}, org_id: {}", 
                         request.getEmail(), response.getOrgId());
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                log.warn("Registration failed for email: {}, message: {}", 
                         request.getEmail(), response.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (IllegalArgumentException e) {
            // Validation errors
            log.error("Validation error during registration: {}", e.getMessage());
            UnifiedRegistrationResponse errorResponse = UnifiedRegistrationResponse.failure(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            // Unexpected errors
            log.error("Unexpected error during registration: {}", e.getMessage(), e);
            UnifiedRegistrationResponse errorResponse = UnifiedRegistrationResponse.failure(
                    "An unexpected error occurred. Please try again later."
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Health check endpoint
     * GET /api/auth/register/health
     */
    @GetMapping("/register/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Registration Orchestrator is running");
    }
    
    /**
     * Get available systems
     * GET /api/auth/register/systems
     */
    @GetMapping("/register/systems")
    public ResponseEntity<?> getAvailableSystems() {
        return ResponseEntity.ok(new Object() {
            public final String[] systems = {"GINUMA", "INVENTORY"};
            public final String ginumaDescription = "Complete HR, Payroll, Accounting, and CRM solution";
            public final String inventoryDescription = "Advanced inventory, warehouse, and supply chain management";
        });
    }
}
