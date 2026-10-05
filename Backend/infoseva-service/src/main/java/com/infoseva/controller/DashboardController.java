package com.infoseva.controller;

import com.infoseva.dto.DashboardDTO;
import com.infoseva.service.DashboardService;
import com.infoseva.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Citizen / Dashboard", description = "Dashboard analytics and aggregations")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // GET /api/dashboard/summary
    @io.swagger.v3.oas.annotations.Operation(
            summary = "Get Public Dashboard Summary",
            description = "Retrieves public dashboard data such as total documents, notices, and FAQs available in the system."
    )
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardDTO>> getDashboardSummary() {
        DashboardDTO summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(
                ApiResponse.<DashboardDTO>builder()
                        .success(true)
                        .message("Dashboard summary fetched successfully")
                        .data(summary)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/dashboard/citizen
    @io.swagger.v3.oas.annotations.Operation(
            summary = "Get Citizen Dashboard Summary",
            description = "Retrieves the dynamic, personalized dashboard data for the authenticated citizen, including latest updates, recent activity, and trending searches.",
            security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "BearerAuth")
    )
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_CITIZEN', 'ROLE_USER')")
    @GetMapping("/citizen")
    public ResponseEntity<ApiResponse<DashboardDTO>> getCitizenDashboardSummary(org.springframework.security.core.Authentication authentication) {
        String email = authentication.getName();
        DashboardDTO summary = dashboardService.getCitizenDashboardSummary(email);
        return ResponseEntity.ok(
                ApiResponse.<DashboardDTO>builder()
                        .success(true)
                        .message("Citizen dashboard fetched successfully")
                        .data(summary)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/dashboard/data-manager
    @io.swagger.v3.oas.annotations.Operation(
            summary = "Get Data Manager Dashboard Summary",
            description = "Retrieves operational metrics for the Data Manager, including pending reviews, content gaps, active data sources, and processed documents.",
            security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "BearerAuth")
    )
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_DATA_MANAGER')")
    @GetMapping("/data-manager")
    public ResponseEntity<ApiResponse<DashboardDTO>> getDataManagerDashboardSummary() {
        DashboardDTO summary = dashboardService.getDataManagerDashboardSummary();
        return ResponseEntity.ok(
                ApiResponse.<DashboardDTO>builder()
                        .success(true)
                        .message("Data Manager dashboard fetched successfully")
                        .data(summary)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }
}
