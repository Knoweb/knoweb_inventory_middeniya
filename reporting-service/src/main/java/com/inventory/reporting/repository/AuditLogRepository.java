package com.inventory.reporting.repository;

import com.inventory.reporting.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserId(Long userId);
    List<AuditLog> findByOrgId(Long orgId);
    List<AuditLog> findByEntity(String entity);
    List<AuditLog> findByAction(String action);
    List<AuditLog> findBySeverity(String severity);
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT a FROM AuditLog a WHERE a.orgId = :orgId AND a.timestamp BETWEEN :start AND :end")
    List<AuditLog> findByOrgIdAndDateRange(@Param("orgId") Long orgId, 
                                            @Param("start") LocalDateTime start, 
                                            @Param("end") LocalDateTime end);
    
    @Query("SELECT a FROM AuditLog a WHERE a.entity = :entity AND a.entityId = :entityId ORDER BY a.timestamp DESC")
    List<AuditLog> findEntityHistory(@Param("entity") String entity, @Param("entityId") Long entityId);
}
