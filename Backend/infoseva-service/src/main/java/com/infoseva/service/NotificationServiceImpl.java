package com.infoseva.service;

import com.infoseva.dto.NotificationEvent;
import com.infoseva.dto.UserSummaryDTO;
import com.infoseva.entity.Notification;
import com.infoseva.repository.OracleNotificationRepository;
import com.infoseva.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final OracleNotificationRepository notificationRepository;
    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public NotificationServiceImpl(OracleNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
        this.restTemplate = new RestTemplate();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            return ((CustomUserDetails) authentication.getPrincipal()).getId();
        }
        return null;
    }

    private String getCurrentJwtToken() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader(HttpHeaders.AUTHORIZATION);
        }
        return null;
    }

    @Override
    public void notifyOtherDataManagers(NotificationEvent event) {
        notifyOtherDataManagers(event, null);
    }

    @Override
    public void notifyOtherDataManagers(NotificationEvent event, String excludedUserEmail) {
        Long currentActorId = getCurrentUserId();
        final Long actorId = currentActorId != null ? currentActorId : 0L;

        // Capture token before switching threads since RequestContextHolder is thread-local
        String token = getCurrentJwtToken();

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                // Fetch other data managers
                String url = authServiceUrl + "/api/users/role/DATA_MANAGER";
                
                HttpHeaders headers = new HttpHeaders();
                if (token != null) {
                    headers.set(HttpHeaders.AUTHORIZATION, token);
                }
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<List<UserSummaryDTO>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<List<UserSummaryDTO>>() {}
                );

                List<UserSummaryDTO> dataManagers = response.getBody();
                if (dataManagers == null || dataManagers.isEmpty()) {
                    log.info("No data managers found to notify");
                    return;
                }

                java.util.List<Notification> notificationsToSave = new java.util.ArrayList<>();
                for (UserSummaryDTO dm : dataManagers) {
                    // Do NOT notify the actor
                    if (actorId != null && actorId > 0 && actorId.equals(dm.getId())) {
                        continue;
                    }
                    // Do NOT notify the excluded user (e.g. original uploader who receives direct notification)
                    if (excludedUserEmail != null && dm.getEmail() != null && dm.getEmail().equalsIgnoreCase(excludedUserEmail.trim())) {
                        continue;
                    }
                    Notification notification = Notification.builder()
                            .recipientUserId(dm.getId())
                            .actorUserId(actorId)
                            .type(event.getType())
                            .title(event.getTitle())
                            .message(event.getMessage())
                            .referenceType(event.getReferenceType())
                            .referenceId(event.getReferenceId())
                            .isRead(false)
                            .build();
                    notificationsToSave.add(notification);
                }
                
                if (!notificationsToSave.isEmpty()) {
                    notificationRepository.saveAll(notificationsToSave);
                    log.info("Saved {} notifications for other data managers", notificationsToSave.size());
                }

            } catch (Exception e) {
                log.error("Failed to notify other data managers. Suppressing error to allow primary transaction to succeed.", e);
            }
        });
    }

    @Override
    public void notifyAdmins(NotificationEvent event) {
        Long currentActorId = getCurrentUserId();
        final Long actorId = currentActorId != null ? currentActorId : 0L;
        String token = getCurrentJwtToken();

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                String url = authServiceUrl + "/api/users/role/ADMIN";
                
                HttpHeaders headers = new HttpHeaders();
                if (token != null) {
                    headers.set(HttpHeaders.AUTHORIZATION, token);
                }
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<List<UserSummaryDTO>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<List<UserSummaryDTO>>() {}
                );

                List<UserSummaryDTO> admins = response.getBody();
                if (admins == null || admins.isEmpty()) {
                    log.info("No admins found to notify");
                    return;
                }

                java.util.List<Notification> notificationsToSave = new java.util.ArrayList<>();
                for (UserSummaryDTO admin : admins) {
                    if (actorId != null && actorId.equals(admin.getId())) {
                        continue;
                    }
                    Notification notification = Notification.builder()
                            .recipientUserId(admin.getId())
                            .actorUserId(actorId != null ? actorId : 0L)
                            .type(event.getType())
                            .title(event.getTitle())
                            .message(event.getMessage())
                            .referenceType(event.getReferenceType())
                            .referenceId(event.getReferenceId())
                            .isRead(false)
                            .build();
                    notificationsToSave.add(notification);
                }

                if (!notificationsToSave.isEmpty()) {
                    notificationRepository.saveAll(notificationsToSave);
                }

            } catch (Exception e) {
                log.error("Failed to notify admins. Suppressing error to allow primary transaction to succeed.", e);
            }
        });
    }

    @Override
    public void notifyDocumentUploader(String uploaderEmail, NotificationEvent event) {
        if (uploaderEmail == null || uploaderEmail.trim().isEmpty()) {
            return;
        }

        Long currentActorId = getCurrentUserId();
        final Long actorId = currentActorId != null ? currentActorId : 0L;
        String token = getCurrentJwtToken();

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                if (token != null) {
                    headers.set(HttpHeaders.AUTHORIZATION, token);
                }
                HttpEntity<String> entity = new HttpEntity<>(headers);

                UserSummaryDTO targetUser = null;
                // 1. Try direct lookup by email
                try {
                    String url = authServiceUrl + "/api/users/by-email?email=" + java.net.URLEncoder.encode(uploaderEmail.trim(), java.nio.charset.StandardCharsets.UTF_8);
                    ResponseEntity<UserSummaryDTO> resp = restTemplate.exchange(url, HttpMethod.GET, entity, UserSummaryDTO.class);
                    targetUser = resp.getBody();
                } catch (Exception ignored) {}

                // 2. Fallback to scanning data managers
                if (targetUser == null) {
                    try {
                        String url = authServiceUrl + "/api/users/role/DATA_MANAGER";
                        ResponseEntity<List<UserSummaryDTO>> resp = restTemplate.exchange(
                                url,
                                HttpMethod.GET,
                                entity,
                                new ParameterizedTypeReference<List<UserSummaryDTO>>() {}
                        );
                        if (resp.getBody() != null) {
                            targetUser = resp.getBody().stream()
                                    .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(uploaderEmail.trim()))
                                    .findFirst()
                                    .orElse(null);
                        }
                    } catch (Exception ignored) {}
                }

                if (targetUser != null) {
                    // Do not notify if uploader is also the actor
                    if (actorId != null && actorId.equals(targetUser.getId())) {
                        return;
                    }

                    Notification notification = Notification.builder()
                            .recipientUserId(targetUser.getId())
                            .actorUserId(actorId != null ? actorId : 0L)
                            .type(event.getType())
                            .title(event.getTitle())
                            .message(event.getMessage())
                            .referenceType(event.getReferenceType())
                            .referenceId(event.getReferenceId())
                            .isRead(false)
                            .build();
                    notificationRepository.save(notification);
                } else {
                    log.warn("Could not find user to notify for uploaderEmail: {}", uploaderEmail);
                }

            } catch (Exception e) {
                log.error("Failed to notify document uploader. Suppressing error.", e);
            }
        });
    }

    @Override
    public void notifyTargetCitizensByDomain(com.infoseva.entity.Document document) {
        if (document == null) return;
        
        Long currentActorId = getCurrentUserId();
        final Long actorId = currentActorId != null ? currentActorId : 0L;
        String token = getCurrentJwtToken();

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                // Determine target professions based on document category / department
                String cat = (document.getCategory() != null ? document.getCategory() : "").toLowerCase();
                String dept = (document.getDepartment() != null && document.getDepartment().getDepartmentName() != null) 
                        ? document.getDepartment().getDepartmentName().toLowerCase() : "";
                String title = (document.getTitle() != null ? document.getTitle() : "").toLowerCase();

                java.util.Set<String> targetProfessions = new java.util.HashSet<>();
                if (cat.contains("educat") || cat.contains("scholar") || dept.contains("educat") || title.contains("scholar") || title.contains("student")) {
                    targetProfessions.add("STUDENT");
                    targetProfessions.add("TEACHER");
                    targetProfessions.add("RESEARCHER");
                }
                if (cat.contains("agri") || dept.contains("agri") || title.contains("kisan") || title.contains("farmer") || title.contains("crop")) {
                    targetProfessions.add("FARMER");
                }
                if (cat.contains("health") || dept.contains("health") || title.contains("ayushman") || title.contains("medic") || title.contains("hospital")) {
                    targetProfessions.add("DOCTOR");
                }
                if (cat.contains("law") || cat.contains("act") || dept.contains("law") || title.contains("act") || title.contains("rule")) {
                    targetProfessions.add("LAWYER");
                }
                if (cat.contains("business") || cat.contains("msme") || cat.contains("commerce") || dept.contains("commerce") || title.contains("msme")) {
                    targetProfessions.add("BUSINESS_OWNER");
                    targetProfessions.add("SELF_EMPLOYED");
                }

                // Fetch citizens
                String url = authServiceUrl + "/api/users/role/CITIZEN";
                HttpHeaders headers = new HttpHeaders();
                if (token != null) {
                    headers.set(HttpHeaders.AUTHORIZATION, token);
                }
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<List<UserSummaryDTO>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<List<UserSummaryDTO>>() {}
                );

                List<UserSummaryDTO> citizens = response.getBody();
                if (citizens == null || citizens.isEmpty()) {
                    log.info("No citizens found to notify for document: {}", document.getTitle());
                    return;
                }

                List<Notification> notificationsToSave = new java.util.ArrayList<>();
                for (UserSummaryDTO citizen : citizens) {
                    if (actorId != null && actorId > 0 && actorId.equals(citizen.getId())) {
                        continue;
                    }

                    boolean isMatch = false;
                    String userProf = citizen.getProfession() != null ? citizen.getProfession().toUpperCase() : "";

                    if (targetProfessions.isEmpty()) {
                        // General citizen document or general category -> match all citizens
                        isMatch = true;
                    } else if (userProf != null && targetProfessions.contains(userProf)) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        String docType = document.getCategory() != null ? document.getCategory() : "Scheme";
                        String message = "Look into this " + docType.toLowerCase() + ": " + document.getTitle();
                        
                        Notification notification = Notification.builder()
                                .recipientUserId(citizen.getId())
                                .actorUserId(actorId)
                                .type(com.infoseva.entity.NotificationType.DOCUMENT_APPROVED)
                                .title("New " + docType + " Available")
                                .message(message)
                                .referenceType("DOCUMENT")
                                .referenceId(String.valueOf(document.getDocumentId()))
                                .isRead(false)
                                .build();
                        notificationsToSave.add(notification);
                    }
                }

                if (!notificationsToSave.isEmpty()) {
                    notificationRepository.saveAll(notificationsToSave);
                    log.info("Successfully created {} personalized notifications for citizens regarding '{}'", notificationsToSave.size(), document.getTitle());
                }
            } catch (Exception e) {
                log.error("Failed to generate personalized citizen notifications for document: " + document.getTitle(), e);
            }
        });
    }

    @Override
    public Page<Notification> getNotificationsForUser(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public Page<Notification> getUnreadNotificationsForUser(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findByIdAndRecipientUserId(notificationId, userId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        // Find all unread notifications for the user
        Page<Notification> unread = notificationRepository.findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, Pageable.unpaged());
        for (Notification notification : unread.getContent()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
}
