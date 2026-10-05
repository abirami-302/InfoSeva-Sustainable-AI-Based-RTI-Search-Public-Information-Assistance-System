package com.infoseva.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogDTO {
    private String id;
    private LocalDateTime time;
    private String level; // INFO, WARN, ERROR
    private String service; // "Documents", "API Sync", "Data Sources", "Auth"
    private String msg;
}
