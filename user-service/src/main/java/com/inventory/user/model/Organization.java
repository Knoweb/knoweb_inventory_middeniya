package com.inventory.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(name = "logo_url")
    private String logoUrl;
    
    @Column(name = "industry_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private IndustryType industryType;
    
    @Column(name = "subscription_tier")
    @Enumerated(EnumType.STRING)
    private SubscriptionTier subscriptionTier = SubscriptionTier.STARTER;
    
    @Column(name = "tenant_id", unique = true, nullable = false)
    private String tenantId;
    
    @Column(name = "contact_email")
    private String contactEmail;
    
    @Column(name = "contact_phone")
    private String contactPhone;
    
    @Column(name = "mobile_number")
    private String mobileNumber;
    
    @Column(name = "website")
    private String website;
    
    @Column(name = "tax_id")
    private String taxId;
    
    @Column(name = "registration_no")
    private String registrationNo;
    
    @Column(name = "tin_no")
    private String tinNo;
    
    @Column(name = "is_vat_registered")
    private Boolean isVatRegistered;
    
    @Column(name = "vat_no")
    private String vatNo;
    
    @Column(name = "registered_address", length = 500)
    private String registeredAddress;
    
    @Column(name = "factory_address", length = 500)
    private String factoryAddress;
    
    @Column(name = "country")
    private String country;
    
    @Column(name = "currency")
    private String currency;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum IndustryType {
        GENERAL, PHARMACY, RETAIL, MANUFACTURING, ECOMMERCE, HEALTHCARE, CONSTRUCTION, FOOD_BEVERAGE, LOGISTICS
    }
    
    public enum SubscriptionTier {
        STARTER, PROFESSIONAL, ENTERPRISE
    }
}
