package com.infoseva.controller;

import com.infoseva.dto.NoticeDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    // POST /api/notices
    @PostMapping
    public ResponseEntity<ApiResponse<NoticeDTO>> createNotice(@Valid @RequestBody NoticeDTO noticeDTO) {
        NoticeDTO created = noticeService.createNotice(noticeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<NoticeDTO>builder()
                        .success(true)
                        .message("Notice created successfully")
                        .data(created)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/notices  — all notices (admin)
    @GetMapping
    public ResponseEntity<ApiResponse<List<NoticeDTO>>> getAllNotices() {
        List<NoticeDTO> notices = noticeService.getAllNotices();
        return ResponseEntity.ok(
                ApiResponse.<List<NoticeDTO>>builder()
                        .success(true)
                        .message("Fetched all notices successfully")
                        .data(notices)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/notices/published  — citizen-facing published notices (paginated & filtered)
    @GetMapping("/published")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<NoticeDTO>>> getPublishedNotices(
            @RequestParam(value = "type", defaultValue = "All") String type,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "6") int size) {
            
        org.springframework.data.domain.Page<NoticeDTO> notices = noticeService.getPublishedNoticesFeed(type, page, size);
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<NoticeDTO>>builder()
                        .success(true)
                        .message("Fetched published notices successfully")
                        .data(notices)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/notices/type/{type}  — filter by type: Circular, Government Order, Act, Scheme
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<NoticeDTO>>> getNoticesByType(@PathVariable String type) {
        List<NoticeDTO> notices = noticeService.getNoticesByType(type);
        return ResponseEntity.ok(
                ApiResponse.<List<NoticeDTO>>builder()
                        .success(true)
                        .message("Fetched notices by type successfully")
                        .data(notices)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // GET /api/notices/{id}
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<NoticeDTO>> getNoticeById(@PathVariable Long id) {
        NoticeDTO notice = noticeService.getNoticeById(id);
        return ResponseEntity.ok(
                ApiResponse.<NoticeDTO>builder()
                        .success(true)
                        .message("Fetched notice successfully")
                        .data(notice)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // PUT /api/notices/{id}
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<NoticeDTO>> updateNotice(
            @PathVariable Long id,
            @Valid @RequestBody NoticeDTO noticeDTO) {
        NoticeDTO updated = noticeService.updateNotice(id, noticeDTO);
        return ResponseEntity.ok(
                ApiResponse.<NoticeDTO>builder()
                        .success(true)
                        .message("Notice updated successfully")
                        .data(updated)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    // DELETE /api/notices/{id}
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Notice deleted successfully")
                        .data(null)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
