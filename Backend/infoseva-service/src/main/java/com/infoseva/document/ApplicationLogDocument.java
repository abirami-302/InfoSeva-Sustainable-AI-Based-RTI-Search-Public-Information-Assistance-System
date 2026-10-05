package com.infoseva.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "application_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationLogDocument {
    @Id
    private String id;
    private String level;
    private String service;
    private String message;
    private String stackTrace;
    private LocalDateTime timestamp;
}
