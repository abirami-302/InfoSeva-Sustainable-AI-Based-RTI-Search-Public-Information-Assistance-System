package com.infoseva.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationDTO {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String department;
    private String type; // Scheme, Circular, Document, etc.
    private double score;
    private List<String> matchReasons;
    private String route;
    private LocalDateTime createdAt;
}
