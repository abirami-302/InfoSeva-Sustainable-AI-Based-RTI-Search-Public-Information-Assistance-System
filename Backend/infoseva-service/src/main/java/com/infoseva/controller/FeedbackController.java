package com.infoseva.controller;

import com.infoseva.dto.FeedbackDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    // POST /api/feedback
    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackDTO>> createFeedback(@Valid @RequestBody FeedbackDTO feedbackDTO) {
        FeedbackDTO created = feedbackService.createFeedback(feedbackDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<FeedbackDTO>builder()
                        .success(true)
                        .message("Feedback created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/feedback
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getAllFeedback() {
        List<FeedbackDTO> feedbacks = feedbackService.getAllFeedback();
        return ResponseEntity.ok(
                ApiResponse.<List<FeedbackDTO>>builder()
                        .success(true)
                        .message("Fetched all feedback successfully")
                        .data(feedbacks)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/feedback/feed
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<FeedbackDTO>>> getFeedbackFeed(
            @RequestParam(value = "status", defaultValue = "All") String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
            
        org.springframework.data.domain.Page<FeedbackDTO> feedback = feedbackService.getFeedbackFeed(status, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<FeedbackDTO>>builder()
                        .success(true)
                        .message("Fetched feedback feed successfully")
                        .data(feedback)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/feedback/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<FeedbackDTO>> getFeedbackById(@PathVariable Long id) {
        FeedbackDTO feedback = feedbackService.getFeedbackById(id);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackDTO>builder()
                        .success(true)
                        .message("Fetched feedback successfully")
                        .data(feedback)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/feedback/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<FeedbackDTO>>> getFeedbackByStatus(@PathVariable String status) {
        List<FeedbackDTO> feedbacks = feedbackService.getFeedbackByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.<List<FeedbackDTO>>builder()
                        .success(true)
                        .message("Fetched feedback by status successfully")
                        .data(feedbacks)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/feedback/resolve/{id}
    @PutMapping("/resolve/{id}")
    public ResponseEntity<ApiResponse<FeedbackDTO>> markResolved(@PathVariable Long id) {
        FeedbackDTO resolved = feedbackService.markResolved(id);
        return ResponseEntity.ok(
                ApiResponse.<FeedbackDTO>builder()
                        .success(true)
                        .message("Feedback marked as resolved successfully")
                        .data(resolved)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/feedback/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Feedback deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
