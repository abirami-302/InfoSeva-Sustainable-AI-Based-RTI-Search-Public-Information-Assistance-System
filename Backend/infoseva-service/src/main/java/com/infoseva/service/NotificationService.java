package com.infoseva.service;

import com.infoseva.dto.NotificationEvent;
import com.infoseva.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void notifyOtherDataManagers(NotificationEvent event);
    
    void notifyOtherDataManagers(NotificationEvent event, String excludedUserEmail);

    void notifyAdmins(NotificationEvent event);

    void notifyDocumentUploader(String uploaderEmail, NotificationEvent event);

    void notifyTargetCitizensByDomain(com.infoseva.entity.Document document);

    Page<Notification> getNotificationsForUser(Long userId, Pageable pageable);

    Page<Notification> getUnreadNotificationsForUser(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}
