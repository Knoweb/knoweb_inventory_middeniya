package com.inventory.catalog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "industry_schemas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndustrySchema {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String industryType;  // PHARMACY, RETAIL, MANUFACTURING, etc.
    
    @Column(nullable = false)
    private String schemaName;
    
    @Column(length = 1000)
    private String description;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "json_schema", columnDefinition = "JSON", nullable = false)
    private Map<String, Object> jsonSchema;  // JSON Schema definition
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "default_values", columnDefinition = "JSON")
    private Map<String, Object> defaultValues;  // Default values for fields
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ui_config", columnDefinition = "JSON")
    private Map<String, Object> uiConfig;  // UI configuration (field types, labels, etc.)
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "version")
    private Integer version = 1;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
