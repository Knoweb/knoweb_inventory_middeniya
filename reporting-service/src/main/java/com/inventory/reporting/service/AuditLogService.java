package com.inventory.reporting.service;

import com.inventory.reporting.model.AuditLog;
import com.inventory.reporting.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public AuditLog createAuditLog(AuditLog auditLog) {
        auditLog.setTimestamp(LocalDateTime.now());
        return auditLogRepository.save(auditLog);
    }
    
    public AuditLog logAction(Long userId, String username, Long orgId, String action, 
                              String entity, Long entityId, String description, String severity) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setOrgId(orgId);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setDescription(description);
        log.setSeverity(severity);
        return createAuditLog(log);
    }
    
    public List<AuditLog> getAuditLogsByUser(Long userId) {
        return auditLogRepository.findByUserId(userId);
    }
    
    public List<AuditLog> getAuditLogsByOrganization(Long orgId) {
        return auditLogRepository.findByOrgId(orgId);
    }
    
    public List<AuditLog> getAuditLogsByEntity(String entity) {
        return auditLogRepository.findByEntity(entity);
    }
    
    public List<AuditLog> getAuditLogsByDateRange(Long orgId, LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByOrgIdAndDateRange(orgId, start, end);
    }
    
    public List<AuditLog> getEntityHistory(String entity, Long entityId) {
        return auditLogRepository.findEntityHistory(entity, entityId);
    }
    
    public List<AuditLog> getCriticalLogs() {
        return auditLogRepository.findBySeverity("CRITICAL");
    }
}
