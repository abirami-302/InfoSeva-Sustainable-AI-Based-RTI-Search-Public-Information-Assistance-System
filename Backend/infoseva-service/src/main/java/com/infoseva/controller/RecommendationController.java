package com.infoseva.controller;

import com.infoseva.dto.RecommendationDTO;
import com.infoseva.response.ApiResponse;
import com.infoseva.security.CustomUserDetails;
import com.infoseva.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getId();
            }
        } catch (Exception ignored) {}
        return null;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<List<RecommendationDTO>>> getRecommendationsByUserId(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "profession", required = false) String profession,
            @RequestParam(name = "limit", defaultValue = "6") int limit) {
        
        List<RecommendationDTO> recommendations = recommendationService.getRecommendationsForUser(userId, profession, limit);
        return ResponseEntity.ok(ApiResponse.<List<RecommendationDTO>>builder()
                .success(true)
                .message("Recommendations retrieved successfully")
                .data(recommendations)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<RecommendationDTO>>> getMyRecommendations(
            @RequestParam(name = "profession", required = false) String profession,
            @RequestParam(name = "limit", defaultValue = "6") int limit) {
        
        Long userId = getCurrentUserId();
        List<RecommendationDTO> recommendations = recommendationService.getRecommendationsForUser(userId, profession, limit);
        return ResponseEntity.ok(ApiResponse.<List<RecommendationDTO>>builder()
                .success(true)
                .message("Personalized recommendations retrieved successfully")
                .data(recommendations)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
