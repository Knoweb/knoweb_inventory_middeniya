package com.inventory.identity.model;

import com.inventory.identity.util.JsonListConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * CompanyTenant Entity
 * Updated to include subscribed_systems JSON column
 * Maps to: subscription_db.company_tenant
 */
@Entity
@Table(name = "company_tenant")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyTenant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "org_id", unique = true, nullable = false)
    private Long orgId;
    
    @Column(name = "company_name", nullable = false)
    private String companyName;
    
    @Column(name = "contact_email")
    private String contactEmail;
    
    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "ACTIVE";  // ACTIVE, BLOCKED, PENDING

    @Column(name = "plan_type", length = 50)
    @Builder.Default
    private String planType = "TRIAL";
    
    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;
    
    @Column(name = "subscription_end_date")
    private LocalDate subscriptionEndDate;
    
    // NEW: JSON column for subscribed systems
    @Convert(converter = JsonListConverter.class)
    @Column(name = "subscribed_systems", columnDefinition = "JSON")
    @Builder.Default
    private List<String> subscribedSystems = new ArrayList<>();
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (subscriptionStartDate == null) {
            subscriptionStartDate = LocalDate.now();
        }
        if (planType == null || planType.isBlank()) {
            planType = "TRIAL";
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Helper method to add a system
     */
    public void addSystem(String systemCode) {
        if (subscribedSystems == null) {
            subscribedSystems = new ArrayList<>();
        }
        if (!subscribedSystems.contains(systemCode)) {
            subscribedSystems.add(systemCode);
        }
    }
    
    /**
     * Helper method to check if company has access to a system
     */
    public boolean hasAccessToSystem(String systemCode) {
        return subscribedSystems != null && subscribedSystems.contains(systemCode);
    }
    
    /**
     * Check if company is active
     */
    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
