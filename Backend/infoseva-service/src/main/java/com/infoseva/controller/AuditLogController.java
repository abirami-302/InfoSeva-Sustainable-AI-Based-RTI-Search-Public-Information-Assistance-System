package com.infoseva.controller;

import com.infoseva.dto.ActivityLogDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.serviceImpl.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getLogs() {
        List<ActivityLogDTO> logs = auditLogService.getRecentActivityLogs();
        return ResponseEntity.ok(
                ApiResponse.<List<ActivityLogDTO>>builder()
                        .success(true)
                        .message("Activity logs retrieved successfully")
                        .data(logs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
