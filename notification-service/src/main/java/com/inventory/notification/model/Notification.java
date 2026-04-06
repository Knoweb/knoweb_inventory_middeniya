package com.inventory.notification.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "org_id")
    private Long orgId;
    
    private String type;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "read_status")
    private Boolean readStatus = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "request_entity_id")
    private Long requestEntityId;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
