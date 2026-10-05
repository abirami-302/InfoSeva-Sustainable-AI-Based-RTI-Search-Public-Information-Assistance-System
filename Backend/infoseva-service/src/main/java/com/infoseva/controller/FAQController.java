package com.infoseva.controller;

import com.infoseva.dto.FAQDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.FAQService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
public class FAQController {

    private final FAQService faqService;

    public FAQController(FAQService faqService) {
        this.faqService = faqService;
    }

    // POST /api/faqs
    @PostMapping
    public ResponseEntity<ApiResponse<FAQDTO>> createFAQ(@Valid @RequestBody FAQDTO faqDTO) {
        FAQDTO created = faqService.createFAQ(faqDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<FAQDTO>builder()
                        .success(true)
                        .message("FAQ created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs  — all FAQs sorted by displayOrder (admin)
    @GetMapping
    public ResponseEntity<ApiResponse<List<FAQDTO>>> getAllFAQs() {
        List<FAQDTO> faqs = faqService.getAllFAQs();
        return ResponseEntity.ok(
                ApiResponse.<List<FAQDTO>>builder()
                        .success(true)
                        .message("Fetched all FAQs successfully")
                        .data(faqs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs/published  — published FAQs (citizen-facing)
    @GetMapping("/published")
    public ResponseEntity<ApiResponse<List<FAQDTO>>> getPublishedFAQs() {
        List<FAQDTO> faqs = faqService.getPublishedFAQs();
        return ResponseEntity.ok(
                ApiResponse.<List<FAQDTO>>builder()
                        .success(true)
                        .message("Fetched published FAQs successfully")
                        .data(faqs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs/feed — paginated and filtered for React frontend
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<FAQDTO>>> getFAQsFeed(
            @RequestParam(value = "category", defaultValue = "All") String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
            
        org.springframework.data.domain.Page<FAQDTO> faqs = faqService.getFAQsFeed(category, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<FAQDTO>>builder()
                        .success(true)
                        .message("Fetched FAQs feed successfully")
                        .data(faqs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FAQDTO>> getFAQById(@PathVariable Long id) {
        FAQDTO faq = faqService.getFAQById(id);
        return ResponseEntity.ok(
                ApiResponse.<FAQDTO>builder()
                        .success(true)
                        .message("Fetched FAQ successfully")
                        .data(faq)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs/category/{category}
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<FAQDTO>>> getFAQsByCategory(@PathVariable String category) {
        List<FAQDTO> faqs = faqService.getFAQsByCategory(category);
        return ResponseEntity.ok(
                ApiResponse.<List<FAQDTO>>builder()
                        .success(true)
                        .message("Fetched FAQs by category successfully")
                        .data(faqs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/faqs/department/{departmentId}
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<FAQDTO>>> getFAQsByDepartment(@PathVariable Long departmentId) {
        List<FAQDTO> faqs = faqService.getFAQsByDepartment(departmentId);
        return ResponseEntity.ok(
                ApiResponse.<List<FAQDTO>>builder()
                        .success(true)
                        .message("Fetched FAQs by department successfully")
                        .data(faqs)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/faqs/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FAQDTO>> updateFAQ(
            @PathVariable Long id,
            @Valid @RequestBody FAQDTO faqDTO) {
        FAQDTO updated = faqService.updateFAQ(id, faqDTO);
        return ResponseEntity.ok(
                ApiResponse.<FAQDTO>builder()
                        .success(true)
                        .message("FAQ updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/faqs/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteFAQ(@PathVariable Long id) {
        faqService.deleteFAQ(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("FAQ deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
