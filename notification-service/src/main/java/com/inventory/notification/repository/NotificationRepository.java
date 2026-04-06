package com.inventory.notification.repository;

import com.inventory.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByOrgId(Long orgId);
    List<Notification> findByReadStatus(Boolean readStatus);
}
