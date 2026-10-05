package com.infoseva.controller;

import com.infoseva.dto.DocumentDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.AnalyticsService;
import com.infoseva.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final com.infoseva.repository.DocumentViewRepository documentViewRepository;
    private final AnalyticsService analyticsService;

    public DocumentController(DocumentService documentService,
                              com.infoseva.repository.DocumentViewRepository documentViewRepository,
                              AnalyticsService analyticsService) {
        this.documentService = documentService;
        this.documentViewRepository = documentViewRepository;
        this.analyticsService = analyticsService;
    }

    // POST /api/documents/{id}/view (Fire-and-forget view logging)
    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<Void>> recordDocumentView(
            @PathVariable("id") Long documentId,
            @RequestParam(name = "userId", required = false) Long paramUserId) {
        
        Long userId = paramUserId;
        if (userId == null) {
            try {
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof com.infoseva.security.CustomUserDetails) {
                    userId = ((com.infoseva.security.CustomUserDetails) auth.getPrincipal()).getId();
                }
            } catch (Exception ignored) {}
        }

        if (userId != null && userId > 0) {
            final Long finalUserId = userId;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    documentViewRepository.save(com.infoseva.entity.DocumentView.builder()
                            .userId(finalUserId)
                            .documentId(documentId)
                            .viewedAt(LocalDateTime.now())
                            .build());
                } catch (Exception ignored) {}
            });
        }

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("View recorded")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build());
    }

    // POST /api/documents
    @PostMapping
    public ResponseEntity<ApiResponse<DocumentDTO>> createDocument(@Valid @RequestBody DocumentDTO documentDTO) {
        DocumentDTO created = documentService.createDocument(documentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Document created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // POST /api/documents/upload
    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDTO>> uploadDocument(
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file,
            @RequestPart("metadata") @Valid DocumentDTO documentDTO) {
        
        DocumentDTO uploaded = documentService.uploadDocument(file, documentDTO);

        // Fire-and-forget: resolve any content gaps whose keyword matches this document's title or category.
        // Must never block or propagate exceptions.
        final String titleTerm = uploaded.getTitle() != null ? uploaded.getTitle() : "";
        final String catTerm   = uploaded.getCategory() != null ? uploaded.getCategory() : "";
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            if (!titleTerm.isBlank()) analyticsService.resolveGapByTerm(titleTerm);
            if (!catTerm.isBlank())   analyticsService.resolveGapByTerm(catTerm);
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Document uploaded successfully")
                        .data(uploaded)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getAllDocuments() {
        List<DocumentDTO> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched all documents successfully")
                        .data(documents)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/feed — paginated and filtered for React frontend
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DocumentDTO>>> getDocumentsFeed(
            @RequestParam(value = "category", defaultValue = "All") String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "6") int size) {
            
        org.springframework.data.domain.Page<DocumentDTO> documents = documentService.getDocumentsFeed(category, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched documents feed successfully")
                        .data(documents)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/review-queue — fetch documents awaiting Data Manager review
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_DATA_MANAGER','ROLE_ADMIN')")
    @GetMapping("/review-queue")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DocumentDTO>>> getReviewQueue(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        org.springframework.data.domain.Page<DocumentDTO> documents = documentService.getReviewQueue(page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched review queue successfully")
                        .data(documents)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/my-drafts — fetch authenticated Data Manager's own drafts
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_DATA_MANAGER','ROLE_ADMIN')")
    @GetMapping("/my-drafts")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DocumentDTO>>> getMyDrafts(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        org.springframework.data.domain.Page<DocumentDTO> drafts = documentService.getMyDrafts(page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched drafts successfully")
                        .data(drafts)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/documents/{id}/submit-draft — Submit draft to Review Queue
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_DATA_MANAGER')")
    @PutMapping("/{id:\\d+}/submit-draft")
    public ResponseEntity<ApiResponse<DocumentDTO>> submitDraftForReview(@PathVariable Long id) {
        DocumentDTO submitted = documentService.submitDraftForReview(id);
        return ResponseEntity.ok(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Draft submitted to review queue successfully")
                        .data(submitted)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/documents/{id}/review — Explicit review decision endpoint
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_DATA_MANAGER')")
    @PutMapping("/{id:\\d+}/review")
    public ResponseEntity<ApiResponse<DocumentDTO>> reviewDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
            
        String decision = payload.get("decision");
        String reason = payload.get("reason");
        DocumentDTO reviewed = documentService.reviewDocument(id, decision, reason);
        return ResponseEntity.ok(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Document review processed successfully")
                        .data(reviewed)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<DocumentDTO>> getDocumentById(@PathVariable Long id) {
        DocumentDTO document = documentService.getDocumentById(id);
        return ResponseEntity.ok(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Fetched document successfully")
                        .data(document)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/category/{category}
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getDocumentsByCategory(@PathVariable String category) {
        List<DocumentDTO> documents = documentService.getDocumentsByCategory(category);
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched documents by category successfully")
                        .data(documents)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/department/{departmentId}
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getDocumentsByDepartment(@PathVariable Long departmentId) {
        List<DocumentDTO> documents = documentService.getDocumentsByDepartment(departmentId);
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentDTO>>builder()
                        .success(true)
                        .message("Fetched documents by department successfully")
                        .data(documents)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/documents/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<DocumentDTO>> updateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentDTO documentDTO) {
        DocumentDTO updated = documentService.updateDocument(id, documentDTO);
        return ResponseEntity.ok(
                ApiResponse.<DocumentDTO>builder()
                        .success(true)
                        .message("Document updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/documents/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Document deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/documents/download/{fileName}
    @GetMapping("/download/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(@PathVariable String fileName,
            @org.springframework.beans.factory.annotation.Value("${app.storage.documents-dir:./uploads/documents}") String uploadDir) {
        documentService.verifyDocumentDownloadAccess(fileName);
        try {
            java.nio.file.Path file = java.nio.file.Paths.get(uploadDir).resolve(fileName).normalize().toAbsolutePath();
            if (!file.getParent().equals(java.nio.file.Paths.get(uploadDir).normalize().toAbsolutePath())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (!java.nio.file.Files.exists(file)) {
                throw new com.infoseva.exception.ResourceNotFoundException("File not found: " + fileName);
            }
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } catch (java.net.MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
