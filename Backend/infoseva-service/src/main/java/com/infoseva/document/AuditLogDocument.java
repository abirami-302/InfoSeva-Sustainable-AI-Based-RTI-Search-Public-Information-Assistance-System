package com.infoseva.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDocument {
    @Id
    private String id;
    private String entityName;
    private Long entityId;
    private String action; // CREATE, UPDATE, DELETE
    private Map<String, Object> changes;
    private String performedBy;
    private LocalDateTime timestamp;
}
