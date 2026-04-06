package com.inventory.identity.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Permission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;  // e.g., "product:create", "inventory:read", "order:delete"
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false)
    private String resource;  // e.g., "product", "inventory", "order"
    
    @Column(nullable = false)
    private String action;  // e.g., "create", "read", "update", "delete"
}
