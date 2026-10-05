package com.infoseva.controller;

import com.infoseva.dto.SearchResultDTO;
import com.infoseva.service.SearchService;
import com.infoseva.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    // GET /api/search?keyword=value&category=X&department=Y&year=Z&page=0&size=10
    @GetMapping
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<SearchResultDTO>>> globalSearch(
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "category", defaultValue = "All") String category,
            @RequestParam(value = "department", defaultValue = "All Departments") String department,
            @RequestParam(value = "year", defaultValue = "All Years") String year,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
            
        org.springframework.data.domain.Page<SearchResultDTO> results = searchService.globalSearchPaginated(keyword, category, department, year, page, size);
        
        return ResponseEntity.ok(
                ApiResponse.<org.springframework.data.domain.Page<SearchResultDTO>>builder()
                        .success(true)
                        .message("Global search completed successfully")
                        .data(results)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }
}
