package com.inventory.reporting.controller;

import com.inventory.reporting.model.AuditLog;
import com.inventory.reporting.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {
    
    @Autowired
    private AuditLogService auditLogService;
    
    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody AuditLog auditLog) {
        return ResponseEntity.ok(auditLogService.createAuditLog(auditLog));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByUser(userId));
    }
    
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByOrganization(orgId));
    }
    
    @GetMapping("/entity/{entity}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(@PathVariable String entity) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByEntity(entity));
    }
    
    @GetMapping("/entity/{entity}/{entityId}")
    public ResponseEntity<List<AuditLog>> getEntityHistory(@PathVariable String entity, 
                                                            @PathVariable Long entityId) {
        return ResponseEntity.ok(auditLogService.getEntityHistory(entity, entityId));
    }
    
    @GetMapping("/organization/{orgId}/range")
    public ResponseEntity<List<AuditLog>> getAuditLogsByDateRange(
            @PathVariable Long orgId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByDateRange(orgId, start, end));
    }
    
    @GetMapping("/critical")
    public ResponseEntity<List<AuditLog>> getCriticalLogs() {
        return ResponseEntity.ok(auditLogService.getCriticalLogs());
    }
}
