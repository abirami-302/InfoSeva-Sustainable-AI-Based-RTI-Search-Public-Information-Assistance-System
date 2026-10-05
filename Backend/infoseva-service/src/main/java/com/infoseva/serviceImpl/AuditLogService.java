package com.infoseva.serviceImpl;

import com.infoseva.document.AuditLogDocument;
import com.infoseva.dto.ActivityLogDTO;
import com.infoseva.mongoRepository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logAction(String entityName, Long entityId, String action, String message) {
        String username = "System";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            username = auth.getName();
        }

        AuditLogDocument log = AuditLogDocument.builder()
                .entityName(entityName)
                .entityId(entityId)
                .action(action)
                .performedBy(username)
                .timestamp(LocalDateTime.now())
                .changes(Map.of("message", message))
                .build();
        auditLogRepository.save(log);
    }

    public List<ActivityLogDTO> getRecentActivityLogs() {
        List<AuditLogDocument> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        
        return logs.stream().map(log -> {
            String service = "System";
            if ("Document".equals(log.getEntityName())) {
                service = "Documents";
            }
            
            String msg = (String) log.getChanges().getOrDefault("message", log.getAction() + " on " + log.getEntityName() + " " + log.getEntityId());
            msg = msg + " (by " + log.getPerformedBy() + ")";
            
            return ActivityLogDTO.builder()
                    .id(log.getId())
                    .time(log.getTimestamp())
                    .level("INFO") // default to INFO
                    .service(service)
                    .msg(msg)
                    .build();
        }).collect(Collectors.toList());
    }
}
