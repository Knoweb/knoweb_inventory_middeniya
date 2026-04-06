package com.inventory.reporting.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "username")
    private String username;
    
    @Column(name = "org_id")
    private Long orgId;
    
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(nullable = false)
    private String action;  // CREATE, UPDATE, DELETE, VIEW, etc.
    
    @Column(nullable = false)
    private String entity;  // Product, Inventory, Order, etc.
    
    @Column(name = "entity_id")
    private Long entityId;
    
    @Column(length = 2000)
    private String description;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", columnDefinition = "JSON")
    private Map<String, Object> oldValue;  // Previous state
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", columnDefinition = "JSON")
    private Map<String, Object> newValue;  // New state
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(nullable = false)
    private String severity;  // INFO, WARNING, ERROR, CRITICAL
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
