package com.infoseva.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDocument {
    @Id
    private String id;
    private String userEmail;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
