package com.infoseva.controller;

import com.infoseva.repository.SearchQueryRepository.ContentGapProjection;
import com.infoseva.service.AnalyticsService;
import com.infoseva.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PreAuthorize("hasAnyAuthority('ROLE_DATA_MANAGER', 'ROLE_ADMIN')")
    @GetMapping("/content-gaps")
    public ResponseEntity<ApiResponse<Page<ContentGapProjection>>> getContentGaps(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        Page<ContentGapProjection> gaps = analyticsService.getContentGapsPaginated(page, size);

        return ResponseEntity.ok(
                ApiResponse.<Page<ContentGapProjection>>builder()
                        .success(true)
                        .message("Content gaps fetched successfully")
                        .data(gaps)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }

    @PreAuthorize("hasAnyAuthority('ROLE_DATA_MANAGER', 'ROLE_ADMIN')")
    @DeleteMapping("/content-gaps/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContentGap(@PathVariable Long id) {
        analyticsService.deleteContentGap(id);

        
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Content gap resolved successfully")
                        .data(null)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }
}
