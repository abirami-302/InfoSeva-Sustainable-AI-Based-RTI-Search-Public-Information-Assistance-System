package com.infoseva.controller;

import com.infoseva.dto.NotificationDTO;
import com.infoseva.entity.Notification;
import com.infoseva.response.ApiResponse;
import com.infoseva.security.CustomUserDetails;
import com.infoseva.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_CITIZEN', 'ROLE_DATA_MANAGER', 'ROLE_ADMIN')")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return ((CustomUserDetails) principal).getId();
        }
        throw new RuntimeException("User not authenticated correctly");
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Long userId = getCurrentUserId();
        Page<Notification> notificationPage = notificationService.getNotificationsForUser(userId, PageRequest.of(page, size));
        
        List<NotificationDTO> dtos = notificationPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.<List<NotificationDTO>>builder()
                .success(true)
                .message("Notifications fetched successfully")
                .data(dtos)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        Long userId = getCurrentUserId();
        long count = notificationService.getUnreadCount(userId);
        
        return ResponseEntity.ok(ApiResponse.<Long>builder()
                .success(true)
                .message("Unread count fetched successfully")
                .data(count)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        notificationService.markAsRead(id, userId);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Notification marked as read")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        Long userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("All notifications marked as read")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
