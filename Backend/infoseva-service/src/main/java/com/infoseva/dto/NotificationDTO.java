package com.infoseva.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String referenceType;
    private String referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
