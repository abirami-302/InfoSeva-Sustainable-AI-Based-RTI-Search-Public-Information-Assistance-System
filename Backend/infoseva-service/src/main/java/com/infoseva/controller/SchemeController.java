package com.infoseva.controller;

import com.infoseva.dto.*;
import com.infoseva.entity.SchemeStatus;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.SchemeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/schemes")
public class SchemeController {

    private final SchemeService schemeService;

    public SchemeController(SchemeService schemeService) {
        this.schemeService = schemeService;
    }

    // POST /api/schemes
    @PostMapping
    public ResponseEntity<ApiResponse<SchemeResponse>> createScheme(@Valid @RequestBody CreateSchemeRequest request) {
        SchemeResponse created = schemeService.createScheme(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<SchemeResponse>builder()
                        .success(true)
                        .message("Scheme created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/schemes
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SchemeSummaryResponse>>> getSchemes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) SchemeStatus status,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        SchemeFilterRequest filter = SchemeFilterRequest.builder()
                .keyword(keyword)
                .departmentId(departmentId)
                .category(category)
                .status(status)
                .featured(featured)
                .build();

        // The Controller simply acts as a thin routing layer, passing the DTO and pagination variables to the Service
        Page<SchemeSummaryResponse> result = schemeService.searchSchemes(filter, page, size, sortBy, sortDir);
        
        return ResponseEntity.ok(
                ApiResponse.<Page<SchemeSummaryResponse>>builder()
                        .success(true)
                        .message("Fetched schemes successfully")
                        .data(result)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/schemes/featured
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<SchemeSummaryResponse>>> getFeaturedSchemes() {
        List<SchemeSummaryResponse> featured = schemeService.getFeaturedSchemes();
        return ResponseEntity.ok(
                ApiResponse.<List<SchemeSummaryResponse>>builder()
                        .success(true)
                        .message("Fetched featured schemes successfully")
                        .data(featured)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/schemes/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<SchemeResponse>> getSchemeById(@PathVariable Long id) {
        SchemeResponse scheme = schemeService.getSchemeById(id);
        return ResponseEntity.ok(
                ApiResponse.<SchemeResponse>builder()
                        .success(true)
                        .message("Fetched scheme successfully")
                        .data(scheme)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/schemes/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<SchemeResponse>> updateScheme(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSchemeRequest request) {
        SchemeResponse updated = schemeService.updateScheme(id, request);
        return ResponseEntity.ok(
                ApiResponse.<SchemeResponse>builder()
                        .success(true)
                        .message("Scheme updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/schemes/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteScheme(@PathVariable Long id) {
        schemeService.deleteScheme(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Scheme deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
