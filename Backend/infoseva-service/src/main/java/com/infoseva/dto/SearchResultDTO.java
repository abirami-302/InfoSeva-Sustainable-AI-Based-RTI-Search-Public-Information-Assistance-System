package com.infoseva.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultDTO {

    // Name of the source module: "Notice", "Document", "FAQ"
    private String module;

    // Primary key of the matching record in its own table
    private Long id;

    // Main searchable heading returned to the caller
    private String title;

    // Supporting detail — summary/description/answer depending on module
    private String description;

    // Added for React frontend compatibility (backward compatible)
    private String type;
    private String summary;
    private String department;
    private java.time.LocalDateTime date;
    private String route;
    private String fileName;
    private Double similarityScore;
    private String snippet;
}
