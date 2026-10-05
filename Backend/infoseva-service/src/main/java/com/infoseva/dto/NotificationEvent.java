package com.infoseva.dto;

import com.infoseva.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {
    private NotificationType type;
    private String title;
    private String message;
    private String referenceType;
    private String referenceId;
}
